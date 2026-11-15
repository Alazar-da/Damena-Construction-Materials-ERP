-- Payroll support for the current Damena schema.
do $$ begin create type public.pay_type as enum ('monthly','weekly','daily'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payroll_status as enum ('draft','approved','paid','void'); exception when duplicate_object then null; end $$;

create table if not exists public.employees(id uuid primary key default gen_random_uuid(),name text not null,employee_number text unique,contact text,is_active boolean not null default true,pay_type public.pay_type not null,rate numeric(14,2) not null check(rate>=0),created_by uuid references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.payroll_records(id uuid primary key default gen_random_uuid(),employee_id uuid references public.employees(id),worker_name text,pay_type public.pay_type not null,period_start date not null,period_end date,quantity numeric(14,3) not null default 1 check(quantity>0),rate_snapshot numeric(14,2) not null check(rate_snapshot>=0),amount numeric(14,2) not null check(amount>=0),status public.payroll_status not null default 'draft',notes text,payment_method text,paid_at timestamptz,created_by uuid references public.profiles(id),created_at timestamptz not null default now());
alter table public.payroll_records add column if not exists worker_name text;
alter table public.payroll_records alter column employee_id drop not null;
update public.payroll_records p set worker_name=e.name from public.employees e where p.employee_id=e.id and p.worker_name is null;
create index if not exists payroll_period on public.payroll_records(period_start desc);
alter table public.employees enable row level security;
alter table public.payroll_records enable row level security;
drop policy if exists employees_admin on public.employees;
create policy employees_admin on public.employees for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists payroll_admin on public.payroll_records;
create policy payroll_admin on public.payroll_records for all to authenticated using(public.is_admin()) with check(public.is_admin());

create or replace function public.create_employee(p_name text,p_employee_number text default null,p_contact text default null,p_pay_type public.pay_type default 'monthly',p_rate numeric default 0) returns uuid language plpgsql security definer set search_path=public as $$ declare x uuid; begin if not public.is_admin() then raise exception 'forbidden'; end if; if nullif(trim(p_name),'') is null then raise exception 'employee name is required'; end if; if p_rate is null or p_rate<0 then raise exception 'rate cannot be negative'; end if; insert into public.employees(name,employee_number,contact,pay_type,rate,created_by) values(trim(p_name),nullif(trim(p_employee_number),''),nullif(trim(p_contact),''),p_pay_type,p_rate,auth.uid()) returning id into x; return x; end $$;
drop function if exists public.create_payroll_record(uuid,date,numeric,text);
drop function if exists public.create_payroll_record(uuid,date,numeric,text,text);
drop function if exists public.mark_payroll_paid(uuid,text);
create or replace function public.create_payroll_payment(p_worker_name text,p_pay_type public.pay_type,p_period_start date,p_amount numeric,p_notes text default null,p_payment_method text default 'cash') returns uuid language plpgsql security definer set search_path=public as $$ declare x uuid; begin if not public.is_admin() then raise exception 'forbidden'; end if; if nullif(trim(p_worker_name),'') is null then raise exception 'worker name is required'; end if; if p_period_start is null then raise exception 'payment date is required'; end if; if p_amount is null or p_amount<=0 then raise exception 'amount must be greater than zero'; end if; if p_payment_method not in ('cash','bank','mobile') then raise exception 'invalid payment method'; end if; insert into public.payroll_records(employee_id,worker_name,pay_type,period_start,quantity,rate_snapshot,amount,status,notes,payment_method,paid_at,created_by) values(null,trim(p_worker_name),p_pay_type,p_period_start,1,p_amount,p_amount,'paid',p_notes,p_payment_method,now(),auth.uid()) returning id into x; return x; end $$;
grant execute on function public.create_employee(text,text,text,public.pay_type,numeric) to authenticated;
grant execute on function public.create_payroll_payment(text,public.pay_type,date,numeric,text,text) to authenticated;
grant select on public.employees,public.payroll_records to authenticated;
