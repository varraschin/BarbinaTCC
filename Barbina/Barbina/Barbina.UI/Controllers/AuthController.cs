using Microsoft.AspNetCore.Mvc;
using Barbina.UI.Services.Interfaces;
using Barbina.UI.ViewModels;

namespace Barbina.UI.Controllers;

[Route("admin/auth")]
public class AuthController : Controller
{
    private readonly IAuthUiService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthUiService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpGet("login")]
    public IActionResult Login(string returnUrl = "/admin")
    {
        if (!string.IsNullOrEmpty(HttpContext.Session.GetString("AdminToken")))
            return Redirect(returnUrl);
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    [HttpPost("login")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid) return View(model);
        try
        {
            var result = await _authService.LoginAsync(model);

            if (!result.User.Perfil.Contains("Administrador"))
            {
                model.ErrorMessage = "Acesso negado. Apenas administradores podem entrar aqui.";
                return View(model);
            }

            HttpContext.Session.SetString("AdminToken", result.Token);
            HttpContext.Session.SetString("AdminNome", result.User.Nome);
            HttpContext.Session.SetString("AdminEmail", result.User.Email);
            HttpContext.Session.SetString("AdminFoto", result.User.Foto ?? "/img/usuarios/avatar.png");

            return Redirect(string.IsNullOrEmpty(model.ReturnUrl) ? "/admin" : model.ReturnUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha no login admin");
            model.ErrorMessage = ex.Message.Contains("Usuário") || ex.Message.Contains("nv") ? ex.Message : "Email ou senha inválidos.";
            return View(model);
        }
    }

    [HttpGet("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return RedirectToAction("Login");
    }
}
