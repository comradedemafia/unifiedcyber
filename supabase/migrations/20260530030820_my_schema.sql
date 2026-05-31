drop extension if exists "pg_net";

drop trigger if exists "audit_blocked_ips" on "public"."blocked_ips";

drop trigger if exists "audit_firewall_logs" on "public"."firewall_logs";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "audit_security_incidents" on "public"."security_incidents";

drop trigger if exists "audit_threat_alerts" on "public"."threat_alerts";

drop policy "Authenticated users can delete blocked IPs" on "public"."blocked_ips";

drop policy "Authenticated users can insert blocked IPs" on "public"."blocked_ips";

drop policy "Only authenticated users can block IPs" on "public"."blocked_ips";

drop policy "Only authenticated users can manage blocked IPs" on "public"."blocked_ips";

drop policy "Users can view blocked IP list" on "public"."blocked_ips";

drop policy "Authenticated users can insert firewall logs" on "public"."firewall_logs";

drop policy "Only authenticated users can insert firewall logs" on "public"."firewall_logs";

drop policy "Users can view firewall logs" on "public"."firewall_logs";

drop policy "Users can insert own profile" on "public"."profiles";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Users can view own profile" on "public"."profiles";

drop policy "Authenticated users can insert incidents" on "public"."security_incidents";

drop policy "Authenticated users can update incidents" on "public"."security_incidents";

drop policy "Only authenticated users can create incidents" on "public"."security_incidents";

drop policy "Only creators/admins can update incidents" on "public"."security_incidents";

drop policy "Users can view incidents" on "public"."security_incidents";

drop policy "Service role can insert audit logs" on "public"."security_logs";

drop policy "Service role can update audit logs" on "public"."security_logs";

drop policy "Users can view own audit logs" on "public"."security_logs";

drop policy "Admins can insert audit events" on "public"."terminal_audit_log";

drop policy "Admins can view all audit events" on "public"."terminal_audit_log";

drop policy "Authenticated users can insert alerts" on "public"."threat_alerts";

drop policy "Authenticated users can update alerts" on "public"."threat_alerts";

drop policy "Only authenticated users can create alerts" on "public"."threat_alerts";

drop policy "Users can update alerts" on "public"."threat_alerts";

drop policy "Users can view threat alerts" on "public"."threat_alerts";

drop policy "Admins can delete roles" on "public"."user_roles";

drop policy "Admins can insert roles" on "public"."user_roles";

drop policy "Users can view own roles" on "public"."user_roles";

revoke delete on table "public"."blocked_ips" from "anon";

revoke insert on table "public"."blocked_ips" from "anon";

revoke references on table "public"."blocked_ips" from "anon";

revoke select on table "public"."blocked_ips" from "anon";

revoke trigger on table "public"."blocked_ips" from "anon";

revoke truncate on table "public"."blocked_ips" from "anon";

revoke update on table "public"."blocked_ips" from "anon";

revoke delete on table "public"."blocked_ips" from "authenticated";

revoke insert on table "public"."blocked_ips" from "authenticated";

revoke references on table "public"."blocked_ips" from "authenticated";

revoke select on table "public"."blocked_ips" from "authenticated";

revoke trigger on table "public"."blocked_ips" from "authenticated";

revoke truncate on table "public"."blocked_ips" from "authenticated";

revoke update on table "public"."blocked_ips" from "authenticated";

revoke delete on table "public"."blocked_ips" from "service_role";

revoke insert on table "public"."blocked_ips" from "service_role";

revoke references on table "public"."blocked_ips" from "service_role";

revoke select on table "public"."blocked_ips" from "service_role";

revoke trigger on table "public"."blocked_ips" from "service_role";

revoke truncate on table "public"."blocked_ips" from "service_role";

revoke update on table "public"."blocked_ips" from "service_role";

revoke delete on table "public"."firewall_logs" from "anon";

revoke insert on table "public"."firewall_logs" from "anon";

revoke references on table "public"."firewall_logs" from "anon";

revoke select on table "public"."firewall_logs" from "anon";

revoke trigger on table "public"."firewall_logs" from "anon";

revoke truncate on table "public"."firewall_logs" from "anon";

revoke update on table "public"."firewall_logs" from "anon";

revoke delete on table "public"."firewall_logs" from "authenticated";

revoke insert on table "public"."firewall_logs" from "authenticated";

revoke references on table "public"."firewall_logs" from "authenticated";

revoke select on table "public"."firewall_logs" from "authenticated";

revoke trigger on table "public"."firewall_logs" from "authenticated";

revoke truncate on table "public"."firewall_logs" from "authenticated";

revoke update on table "public"."firewall_logs" from "authenticated";

revoke delete on table "public"."firewall_logs" from "service_role";

revoke insert on table "public"."firewall_logs" from "service_role";

revoke references on table "public"."firewall_logs" from "service_role";

revoke select on table "public"."firewall_logs" from "service_role";

revoke trigger on table "public"."firewall_logs" from "service_role";

revoke truncate on table "public"."firewall_logs" from "service_role";

revoke update on table "public"."firewall_logs" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

revoke delete on table "public"."profiles" from "service_role";

revoke insert on table "public"."profiles" from "service_role";

revoke references on table "public"."profiles" from "service_role";

revoke select on table "public"."profiles" from "service_role";

revoke trigger on table "public"."profiles" from "service_role";

revoke truncate on table "public"."profiles" from "service_role";

revoke update on table "public"."profiles" from "service_role";

revoke delete on table "public"."security_incidents" from "anon";

revoke insert on table "public"."security_incidents" from "anon";

revoke references on table "public"."security_incidents" from "anon";

revoke select on table "public"."security_incidents" from "anon";

revoke trigger on table "public"."security_incidents" from "anon";

revoke truncate on table "public"."security_incidents" from "anon";

revoke update on table "public"."security_incidents" from "anon";

revoke delete on table "public"."security_incidents" from "authenticated";

revoke insert on table "public"."security_incidents" from "authenticated";

revoke references on table "public"."security_incidents" from "authenticated";

revoke select on table "public"."security_incidents" from "authenticated";

revoke trigger on table "public"."security_incidents" from "authenticated";

revoke truncate on table "public"."security_incidents" from "authenticated";

revoke update on table "public"."security_incidents" from "authenticated";

revoke delete on table "public"."security_incidents" from "service_role";

revoke insert on table "public"."security_incidents" from "service_role";

revoke references on table "public"."security_incidents" from "service_role";

revoke select on table "public"."security_incidents" from "service_role";

revoke trigger on table "public"."security_incidents" from "service_role";

revoke truncate on table "public"."security_incidents" from "service_role";

revoke update on table "public"."security_incidents" from "service_role";

revoke delete on table "public"."security_logs" from "anon";

revoke insert on table "public"."security_logs" from "anon";

revoke references on table "public"."security_logs" from "anon";

revoke select on table "public"."security_logs" from "anon";

revoke trigger on table "public"."security_logs" from "anon";

revoke truncate on table "public"."security_logs" from "anon";

revoke update on table "public"."security_logs" from "anon";

revoke delete on table "public"."security_logs" from "authenticated";

revoke insert on table "public"."security_logs" from "authenticated";

revoke references on table "public"."security_logs" from "authenticated";

revoke select on table "public"."security_logs" from "authenticated";

revoke trigger on table "public"."security_logs" from "authenticated";

revoke truncate on table "public"."security_logs" from "authenticated";

revoke update on table "public"."security_logs" from "authenticated";

revoke delete on table "public"."security_logs" from "service_role";

revoke insert on table "public"."security_logs" from "service_role";

revoke references on table "public"."security_logs" from "service_role";

revoke select on table "public"."security_logs" from "service_role";

revoke trigger on table "public"."security_logs" from "service_role";

revoke truncate on table "public"."security_logs" from "service_role";

revoke update on table "public"."security_logs" from "service_role";

revoke delete on table "public"."terminal_audit_log" from "anon";

revoke insert on table "public"."terminal_audit_log" from "anon";

revoke references on table "public"."terminal_audit_log" from "anon";

revoke select on table "public"."terminal_audit_log" from "anon";

revoke trigger on table "public"."terminal_audit_log" from "anon";

revoke truncate on table "public"."terminal_audit_log" from "anon";

revoke update on table "public"."terminal_audit_log" from "anon";

revoke delete on table "public"."terminal_audit_log" from "authenticated";

revoke insert on table "public"."terminal_audit_log" from "authenticated";

revoke references on table "public"."terminal_audit_log" from "authenticated";

revoke select on table "public"."terminal_audit_log" from "authenticated";

revoke trigger on table "public"."terminal_audit_log" from "authenticated";

revoke truncate on table "public"."terminal_audit_log" from "authenticated";

revoke update on table "public"."terminal_audit_log" from "authenticated";

revoke delete on table "public"."terminal_audit_log" from "service_role";

revoke insert on table "public"."terminal_audit_log" from "service_role";

revoke references on table "public"."terminal_audit_log" from "service_role";

revoke select on table "public"."terminal_audit_log" from "service_role";

revoke trigger on table "public"."terminal_audit_log" from "service_role";

revoke truncate on table "public"."terminal_audit_log" from "service_role";

revoke update on table "public"."terminal_audit_log" from "service_role";

revoke delete on table "public"."threat_alerts" from "anon";

revoke insert on table "public"."threat_alerts" from "anon";

revoke references on table "public"."threat_alerts" from "anon";

revoke select on table "public"."threat_alerts" from "anon";

revoke trigger on table "public"."threat_alerts" from "anon";

revoke truncate on table "public"."threat_alerts" from "anon";

revoke update on table "public"."threat_alerts" from "anon";

revoke delete on table "public"."threat_alerts" from "authenticated";

revoke insert on table "public"."threat_alerts" from "authenticated";

revoke references on table "public"."threat_alerts" from "authenticated";

revoke select on table "public"."threat_alerts" from "authenticated";

revoke trigger on table "public"."threat_alerts" from "authenticated";

revoke truncate on table "public"."threat_alerts" from "authenticated";

revoke update on table "public"."threat_alerts" from "authenticated";

revoke delete on table "public"."threat_alerts" from "service_role";

revoke insert on table "public"."threat_alerts" from "service_role";

revoke references on table "public"."threat_alerts" from "service_role";

revoke select on table "public"."threat_alerts" from "service_role";

revoke trigger on table "public"."threat_alerts" from "service_role";

revoke truncate on table "public"."threat_alerts" from "service_role";

revoke update on table "public"."threat_alerts" from "service_role";

revoke delete on table "public"."user_roles" from "anon";

revoke insert on table "public"."user_roles" from "anon";

revoke references on table "public"."user_roles" from "anon";

revoke select on table "public"."user_roles" from "anon";

revoke trigger on table "public"."user_roles" from "anon";

revoke truncate on table "public"."user_roles" from "anon";

revoke update on table "public"."user_roles" from "anon";

revoke delete on table "public"."user_roles" from "authenticated";

revoke insert on table "public"."user_roles" from "authenticated";

revoke references on table "public"."user_roles" from "authenticated";

revoke select on table "public"."user_roles" from "authenticated";

revoke trigger on table "public"."user_roles" from "authenticated";

revoke truncate on table "public"."user_roles" from "authenticated";

revoke update on table "public"."user_roles" from "authenticated";

revoke delete on table "public"."user_roles" from "service_role";

revoke insert on table "public"."user_roles" from "service_role";

revoke references on table "public"."user_roles" from "service_role";

revoke select on table "public"."user_roles" from "service_role";

revoke trigger on table "public"."user_roles" from "service_role";

revoke truncate on table "public"."user_roles" from "service_role";

revoke update on table "public"."user_roles" from "service_role";

alter table "public"."blocked_ips" drop constraint "blocked_ips_ip_address_key";

alter table "public"."profiles" drop constraint "profiles_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_user_id_key";

alter table "public"."security_logs" drop constraint "security_logs_user_id_fkey";

alter table "public"."security_logs" drop constraint "valid_severity";

alter table "public"."user_roles" drop constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_user_id_role_key";

drop trigger if exists "on_auth_user_created" on "auth"."users";
drop trigger if exists "on_auth_user_created_role" on "auth"."users";

drop function if exists "public"."audit_security_event"();

drop function if exists "public"."get_audit_logs"(p_event_type text, p_severity public.audit_level, p_limit integer);

drop function if exists "public"."handle_new_user"();

drop function if exists "public"."handle_new_user_role"();

drop function if exists "public"."has_role"(_user_id uuid, _role public.app_role);
drop function if exists "public"."log_auth_event"(p_event_type text, p_status text, p_details jsonb, p_ip_address text, p_user_agent text);

drop function if exists "public"."log_security_event"(p_event_type text, p_action text, p_resource_type text, p_resource_id uuid, p_severity public.audit_level, p_status text, p_details jsonb, p_ip_address text, p_user_agent text, p_source_system text);

drop function if exists "public"."update_updated_at_column"();

alter table "public"."blocked_ips" drop constraint "blocked_ips_pkey";

alter table "public"."firewall_logs" drop constraint "firewall_logs_pkey";

alter table "public"."profiles" drop constraint "profiles_pkey";

alter table "public"."security_incidents" drop constraint "security_incidents_pkey";

alter table "public"."security_logs" drop constraint "security_logs_pkey";

alter table "public"."terminal_audit_log" drop constraint "terminal_audit_log_pkey";

alter table "public"."threat_alerts" drop constraint "threat_alerts_pkey";

alter table "public"."user_roles" drop constraint "user_roles_pkey";

drop index if exists "public"."blocked_ips_ip_address_key";

drop index if exists "public"."blocked_ips_pkey";

drop index if exists "public"."firewall_logs_pkey";

drop index if exists "public"."idx_security_logs_created_at";

drop index if exists "public"."idx_security_logs_event_type";

drop index if exists "public"."idx_security_logs_severity";

drop index if exists "public"."idx_security_logs_user_id";

drop index if exists "public"."idx_terminal_audit_created";

drop index if exists "public"."idx_terminal_audit_event";

drop index if exists "public"."profiles_pkey";

drop index if exists "public"."profiles_user_id_key";

drop index if exists "public"."security_incidents_pkey";

drop index if exists "public"."security_logs_pkey";

drop index if exists "public"."terminal_audit_log_pkey";

drop index if exists "public"."threat_alerts_pkey";

drop index if exists "public"."user_roles_pkey";

drop index if exists "public"."user_roles_user_id_role_key";

drop table "public"."blocked_ips";

drop table "public"."firewall_logs";

drop table "public"."profiles";

drop table "public"."security_incidents";

drop table "public"."security_logs";

drop table "public"."terminal_audit_log";

drop table "public"."threat_alerts";

drop table "public"."user_roles";

drop type "public"."app_role";

drop type "public"."audit_level";

drop trigger if exists "tr_check_filters" on "realtime"."subscription";

drop trigger if exists "enforce_bucket_name_length_trigger" on "storage"."buckets";

drop trigger if exists "protect_buckets_delete" on "storage"."buckets";

drop trigger if exists "protect_objects_delete" on "storage"."objects";

drop trigger if exists "update_objects_updated_at" on "storage"."objects";


