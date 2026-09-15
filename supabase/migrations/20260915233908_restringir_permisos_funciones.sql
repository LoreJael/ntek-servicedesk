revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;

revoke execute on function public.is_tecnico() from public;
revoke execute on function public.is_tecnico() from anon;