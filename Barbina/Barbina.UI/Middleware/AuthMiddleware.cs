namespace Barbina.UI.Middleware;

public class AuthMiddleware
{
    private readonly RequestDelegate _next;

    public AuthMiddleware(RequestDelegate next) { _next = next; }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Protege rotas /admin (exceto /admin/auth/login e /admin/auth/logout)
        if (path.StartsWith("/admin") && !path.StartsWith("/admin/auth"))
        {
            var token = context.Session.GetString("AdminToken");
            if (string.IsNullOrEmpty(token))
            {
                context.Response.Redirect("/admin/auth/login");
                return;
            }
        }
        await _next(context);
    }
}
