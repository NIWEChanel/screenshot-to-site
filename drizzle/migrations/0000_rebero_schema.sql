
create type public.app_role as enum ('admin','commissioner','client');
create type public.property_status as enum ('pending','approved','rejected','sold','rented');
create type public.payment_status as enum ('pending','approved','rejected');
create type public.commissioner_status as enum ('pending','active','suspended','rejected');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null, price bigint not null default 0, duration_days int not null default 30,
  max_listings int not null default 10, description text not null default '',
  is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, is_demo boolean not null default false);
create table public.locations (id uuid primary key default gen_random_uuid(), name text not null, district text not null default '', is_demo boolean not null default false);

create table public.commissioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  name text not null, email text not null default '', phone text not null default '', whatsapp text not null default '',
  avatar_url text, bio text not null default '',
  status public.commissioner_status not null default 'pending',
  plan_id uuid references public.plans(id) on delete set null,
  sub_start timestamptz, sub_end timestamptz,
  is_demo boolean not null default false, created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  commissioner_id uuid not null references public.commissioners(id) on delete cascade,
  title text not null, description text not null default '',
  price bigint not null default 0, listing_type text not null default 'sale',
  category_id uuid references public.categories(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  bedrooms int not null default 0, bathrooms int not null default 0, area_sqm int not null default 0,
  images text[] not null default '{}',
  status public.property_status not null default 'pending',
  rejection_reason text, featured boolean not null default false, views int not null default 0,
  is_demo boolean not null default false, created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  commissioner_id uuid not null references public.commissioners(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  amount bigint not null default 0, method text not null default 'MTN MoMo (demo)', reference text not null default '',
  status public.payment_status not null default 'pending', note text,
  is_demo boolean not null default true, created_at timestamptz not null default now(), reviewed_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, commissioner_id uuid references public.commissioners(id) on delete cascade,
  message text not null, read boolean not null default false,
  is_demo boolean not null default false, created_at timestamptz not null default now()
);

create table public.settings (key text primary key, value text not null default '');

grant select on public.plans, public.categories, public.locations, public.commissioners, public.properties, public.settings to anon;
grant select, insert, update, delete on public.plans, public.categories, public.locations, public.commissioners, public.properties, public.payments, public.notifications, public.settings to authenticated;
grant all on public.plans, public.categories, public.locations, public.commissioners, public.properties, public.payments, public.notifications, public.settings to service_role;

alter table public.plans enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.commissioners enable row level security;
alter table public.properties enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

create or replace function public.my_commissioner_id() returns uuid language sql stable security definer set search_path = public
as $$ select id from public.commissioners where user_id = auth.uid() limit 1 $$;

-- lookup tables
create policy "read plans" on public.plans for select using (true);
create policy "admin plans" on public.plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read cats" on public.categories for select using (true);
create policy "admin cats" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read locs" on public.locations for select using (true);
create policy "admin locs" on public.locations for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read settings" on public.settings for select using (true);
create policy "admin settings" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- commissioners
create policy "public active commissioners" on public.commissioners for select using (status = 'active' or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own commissioner update" on public.commissioners for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin commissioners" on public.commissioners for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_commissioner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.status := old.status; new.plan_id := old.plan_id; new.sub_start := old.sub_start; new.sub_end := old.sub_end;
    new.user_id := old.user_id; new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
create trigger guard_commissioner before update on public.commissioners for each row execute function public.guard_commissioner();

-- properties
create policy "public properties" on public.properties for select using (
  status in ('approved','sold','rented') or commissioner_id = public.my_commissioner_id() or public.has_role(auth.uid(),'admin'));
create policy "owner insert property" on public.properties for insert to authenticated with check (
  commissioner_id = public.my_commissioner_id()
  and exists (select 1 from public.commissioners c where c.id = commissioner_id and c.status = 'active' and c.sub_end > now()));
create policy "owner update property" on public.properties for update to authenticated using (commissioner_id = public.my_commissioner_id()) with check (commissioner_id = public.my_commissioner_id());
create policy "owner delete property" on public.properties for delete to authenticated using (commissioner_id = public.my_commissioner_id());
create policy "admin properties" on public.properties for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_property() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.featured := false; new.views := 0; new.rejection_reason := null; new.is_demo := false;
    else
      new.featured := old.featured; new.views := old.views; new.is_demo := old.is_demo;
      if new.status in ('sold','rented') and old.status in ('approved','sold','rented') then
        null;
      else
        new.status := 'pending'; new.rejection_reason := null;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger guard_property before insert or update on public.properties for each row execute function public.guard_property();

create or replace function public.increment_view(_id uuid) returns void language sql security definer set search_path = public
as $$ update public.properties set views = views + 1 where id = _id and status in ('approved','sold','rented') $$;
grant execute on function public.increment_view(uuid) to anon, authenticated;

-- payments
create policy "own payments" on public.payments for select to authenticated using (commissioner_id = public.my_commissioner_id() or public.has_role(auth.uid(),'admin'));
create policy "own payment insert" on public.payments for insert to authenticated with check (commissioner_id = public.my_commissioner_id());
create policy "admin payments" on public.payments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.guard_payment() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.status := 'pending'; new.is_demo := true; new.reviewed_at := null;
    select price into new.amount from public.plans where id = new.plan_id;
  end if;
  return new;
end $$;
create trigger guard_payment before insert on public.payments for each row execute function public.guard_payment();

-- notifications
create policy "own notifications" on public.notifications for select to authenticated using (user_id = auth.uid() or commissioner_id = public.my_commissioner_id() or public.has_role(auth.uid(),'admin'));
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid() or commissioner_id = public.my_commissioner_id());
create policy "admin notifications" on public.notifications for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- admin review actions
create or replace function public.review_payment(_id uuid, _approve boolean, _note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare p record; pl record;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'not allowed'; end if;
  select * into p from public.payments where id = _id;
  if p is null then raise exception 'not found'; end if;
  update public.payments set status = case when _approve then 'approved'::payment_status else 'rejected'::payment_status end, note = _note, reviewed_at = now() where id = _id;
  if _approve then
    select * into pl from public.plans where id = p.plan_id;
    update public.commissioners set plan_id = p.plan_id, sub_start = now(), sub_end = now() + make_interval(days => coalesce(pl.duration_days,30)),
      status = case when status = 'suspended' then status else 'active' end where id = p.commissioner_id;
    insert into public.notifications(commissioner_id, message, is_demo) values (p.commissioner_id, 'Your demo payment was approved. Subscription "' || coalesce(pl.name,'') || '" is active.', p.is_demo);
  else
    insert into public.notifications(commissioner_id, message, is_demo) values (p.commissioner_id, 'Your demo payment was rejected' || coalesce(': ' || _note, '.'), p.is_demo);
  end if;
end $$;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;

create or replace function public.notify_property_review() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected') then
    insert into public.notifications(commissioner_id, message, is_demo)
    values (new.commissioner_id, 'Listing "' || new.title || '" was ' || new.status || coalesce(' — ' || new.rejection_reason, ''), new.is_demo);
  end if;
  return new;
end $$;
create trigger notify_property_review after update on public.properties for each row execute function public.notify_property_review();

-- signup: role from metadata (never admin)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare t text := coalesce(new.raw_user_meta_data->>'account_type','client');
begin
  if new.email like '%@realestate.demo' then return new; end if;
  if t = 'commissioner' then
    insert into public.user_roles(user_id, role) values (new.id, 'commissioner') on conflict do nothing;
    insert into public.commissioners(user_id, name, email, phone, whatsapp, status)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email,
            coalesce(new.raw_user_meta_data->>'phone',''), coalesce(new.raw_user_meta_data->>'phone',''), 'pending');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'client') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- demo dataset (only touches is_demo rows)
create or replace function public.reset_demo_data() returns void language plpgsql security definer set search_path = public as $$
declare
  p_basic uuid := 'a0000000-0000-0000-0000-000000000001'; p_pro uuid := 'a0000000-0000-0000-0000-000000000002'; p_elite uuid := 'a0000000-0000-0000-0000-000000000003';
  c_house uuid := 'b0000000-0000-0000-0000-000000000001'; c_apt uuid := 'b0000000-0000-0000-0000-000000000002'; c_land uuid := 'b0000000-0000-0000-0000-000000000003'; c_com uuid := 'b0000000-0000-0000-0000-000000000004'; c_villa uuid := 'b0000000-0000-0000-0000-000000000005';
  l1 uuid := 'c0000000-0000-0000-0000-000000000001'; l2 uuid := 'c0000000-0000-0000-0000-000000000002'; l3 uuid := 'c0000000-0000-0000-0000-000000000003'; l4 uuid := 'c0000000-0000-0000-0000-000000000004'; l5 uuid := 'c0000000-0000-0000-0000-000000000005'; l6 uuid := 'c0000000-0000-0000-0000-000000000006'; l7 uuid := 'c0000000-0000-0000-0000-000000000007';
  k1 uuid := 'd0000000-0000-0000-0000-000000000001'; k2 uuid := 'd0000000-0000-0000-0000-000000000002'; k3 uuid := 'd0000000-0000-0000-0000-000000000003'; k4 uuid := 'd0000000-0000-0000-0000-000000000004'; k5 uuid := 'd0000000-0000-0000-0000-000000000005';
begin
  delete from public.notifications where is_demo;
  delete from public.payments where is_demo;
  delete from public.properties where is_demo or commissioner_id in (select id from public.commissioners where is_demo);
  delete from public.commissioners where is_demo;
  delete from public.plans where is_demo;
  delete from public.categories where is_demo;
  delete from public.locations where is_demo;

  insert into public.plans(id,name,price,duration_days,max_listings,description,is_demo) values
   (p_basic,'Basic',15000,30,5,'Up to 5 active listings for 30 days',true),
   (p_pro,'Professional',40000,90,25,'Up to 25 listings for 3 months, priority support',true),
   (p_elite,'Elite',120000,365,200,'Unlimited-style listings for a full year',true);
  insert into public.categories(id,name,is_demo) values (c_house,'House',true),(c_apt,'Apartment',true),(c_land,'Land',true),(c_com,'Commercial',true),(c_villa,'Villa',true);
  insert into public.locations(id,name,district,is_demo) values
   (l1,'Kigali','City of Kigali',true),(l2,'Gasabo','Kigali',true),(l3,'Kicukiro','Kigali',true),(l4,'Nyarugenge','Kigali',true),
   (l5,'Huye','Southern',true),(l6,'Musanze','Northern',true),(l7,'Rubavu','Western',true);

  insert into public.commissioners(id,name,email,phone,whatsapp,avatar_url,bio,status,plan_id,sub_start,sub_end,is_demo) values
   (k1,'Aline Uwase','commissioner@realestate.demo','+250788100001','250788100001','https://i.pravatar.cc/300?img=47','Kigali residential specialist with 8 years of experience.','active',p_pro, now()-interval '20 days', now()+interval '70 days',true),
   (k2,'Jean-Paul Habimana','jp.habimana@realestate.demo','+250788100002','250788100002','https://i.pravatar.cc/300?img=12','Commercial and land deals across Rwanda.','active',p_elite, now()-interval '100 days', now()+interval '265 days',true),
   (k3,'Claudine Mukamana','claudine@realestate.demo','+250788100003','250788100003','https://i.pravatar.cc/300?img=45','Lake Kivu and Rubavu holiday homes.','active',p_basic, now()-interval '10 days', now()+interval '20 days',true),
   (k4,'Eric Niyonzima','eric@realestate.demo','+250788100004','250788100004','https://i.pravatar.cc/300?img=15','Musanze and Northern Province properties.','pending',null,null,null,true),
   (k5,'Diane Ingabire','diane@realestate.demo','+250788100005','250788100005','https://i.pravatar.cc/300?img=32','Student housing in Huye.','suspended',p_basic, now()-interval '60 days', now()-interval '30 days',true);

  update public.commissioners c set user_id = u.id from auth.users u where c.id = k1 and u.email = 'commissioner@realestate.demo';

  insert into public.properties(commissioner_id,title,description,price,listing_type,category_id,location_id,bedrooms,bathrooms,area_sqm,images,status,rejection_reason,featured,views,is_demo,created_at) values
   (k1,'Hillside Villa in Nyarutarama','Spacious 5-bedroom villa with panoramic views over Kigali, landscaped garden, staff quarters and double garage.',650000000,'sale',c_villa,l2,5,4,520,'{villa,apartment,lake}','approved',null,true,412,true,now()-interval '30 days'),
   (k1,'Modern Apartment in Kimihurura','Furnished 3-bedroom apartment with balcony, backup generator and 24/7 security.',1200000,'rent',c_apt,l2,3,2,140,'{apartment,villa}','approved',null,true,288,true,now()-interval '25 days'),
   (k1,'Family House in Kicukiro','Comfortable 4-bedroom family home near schools and Kicukiro market.',180000000,'sale',c_house,l3,4,3,300,'{villa,land}','approved',null,false,156,true,now()-interval '22 days'),
   (k1,'Studio near Kigali Heights','Compact furnished studio ideal for young professionals.',450000,'rent',c_apt,l1,1,1,45,'{apartment}','pending',null,false,0,true,now()-interval '2 days'),
   (k1,'Townhouse in Gikondo','3-bedroom townhouse — photos need improvement.',95000000,'sale',c_house,l3,3,2,180,'{villa}','rejected','Please upload clearer exterior photos and confirm land title number.',false,0,true,now()-interval '5 days'),
   (k1,'Sold Bungalow in Kanombe','Charming bungalow close to the airport.',120000000,'sale',c_house,l3,3,2,220,'{villa,apartment}','sold',null,false,340,true,now()-interval '60 days'),
   (k2,'Commercial Plot in Nyarugenge CBD','Prime 1,200 sqm commercial plot with approved building permit.',900000000,'sale',c_com,l4,0,0,1200,'{land,villa}','approved',null,true,521,true,now()-interval '40 days'),
   (k2,'Office Space in Kigali City Tower Area','Open-plan office floor, 400 sqm, parking included.',6500000,'rent',c_com,l4,0,4,400,'{apartment,land}','approved',null,false,198,true,now()-interval '18 days'),
   (k2,'Farmland near Musanze','5 hectares of fertile volcanic soil with water access.',75000000,'sale',c_land,l6,0,0,50000,'{land}','approved',null,false,87,true,now()-interval '15 days'),
   (k2,'Shop & Plot on Musanze Road','Retail building with expansion plot, views of the volcanoes.',140000000,'sale',c_com,l6,0,2,800,'{land,villa}','approved',null,true,233,true,now()-interval '12 days'),
   (k3,'Lake Kivu Holiday Home','Brick lakeside home in Rubavu with private garden and lake access.',320000000,'sale',c_house,l7,4,3,350,'{lake,villa,apartment}','approved',null,true,610,true,now()-interval '35 days'),
   (k3,'Gisenyi Beach Apartment','2-bedroom apartment steps from the beach.',800000,'rent',c_apt,l7,2,2,95,'{lake,apartment}','approved',null,false,142,true,now()-interval '9 days'),
   (k3,'Rented Cottage in Rubavu','Cozy cottage with lake view.',500000,'rent',c_house,l7,2,1,90,'{lake}','rented',null,false,98,true,now()-interval '50 days'),
   (k2,'Student Residence in Huye','12-room residence near University of Rwanda Huye campus.',210000000,'sale',c_com,l5,12,6,600,'{apartment,villa}','approved',null,false,76,true,now()-interval '20 days'),
   (k2,'Residential Plot in Gasabo','600 sqm residential plot in Kibagabaga, all utilities nearby.',45000000,'sale',c_land,l2,0,0,600,'{land}','pending',null,false,0,true,now()-interval '1 day'),
   (k3,'Garden Apartment in Huye','Quiet 2-bedroom apartment with garden.',300000,'rent',c_apt,l5,2,1,80,'{apartment}','approved',null,false,54,true,now()-interval '7 days');

  insert into public.payments(commissioner_id,plan_id,amount,method,reference,status,is_demo,created_at,reviewed_at) values
   (k1,p_pro,40000,'MTN MoMo (demo)','DEMO-MOMO-1001','approved',true,now()-interval '20 days',now()-interval '20 days'),
   (k2,p_elite,120000,'Bank transfer (demo)','DEMO-BK-2001','approved',true,now()-interval '100 days',now()-interval '99 days'),
   (k3,p_basic,15000,'Airtel Money (demo)','DEMO-AIR-3001','approved',true,now()-interval '10 days',now()-interval '10 days'),
   (k4,p_basic,15000,'MTN MoMo (demo)','DEMO-MOMO-4001','pending',true,now()-interval '1 day',null),
   (k5,p_pro,40000,'MTN MoMo (demo)','DEMO-MOMO-5001','rejected',true,now()-interval '30 days',now()-interval '29 days');

  insert into public.notifications(commissioner_id,message,is_demo,created_at) values
   (k1,'Welcome to REBERO demo! Your Professional plan is active.',true,now()-interval '20 days'),
   (k1,'Listing "Townhouse in Gikondo" was rejected — Please upload clearer exterior photos and confirm land title number.',true,now()-interval '4 days'),
   (k1,'Your listing "Hillside Villa in Nyarutarama" passed 400 views.',true,now()-interval '1 day');

  insert into public.settings(key,value) values ('site_name','REBERO'),('contact_email','hello@rebero.demo'),('contact_phone','+250788000000'),('currency','RWF')
  on conflict (key) do nothing;
end $$;
revoke execute on function public.reset_demo_data() from public, anon, authenticated;
grant execute on function public.reset_demo_data() to service_role;

select public.reset_demo_data();
