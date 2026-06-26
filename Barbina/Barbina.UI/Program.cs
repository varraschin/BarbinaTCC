using Barbina.UI.Middleware;
using Barbina.UI.Models;
using Barbina.UI.Services.Implementations;
using Barbina.UI.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(60);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

builder.Services.Configure<ApiSettings>(builder.Configuration.GetSection("ApiSettings"));

var apiBaseUrl = builder.Configuration["ApiSettings:BaseUrl"] ?? "http://localhost:5058/api/";
builder.Services.AddHttpClient<IApiService, ApiService>(client =>
{
    client.BaseAddress = new Uri(apiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddScoped<IAuthUiService, AuthUiService>();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseMiddleware<AuthMiddleware>();
app.UseAuthorization();

// Rota padrão — cobre tanto /admin/* quanto as páginas públicas
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
