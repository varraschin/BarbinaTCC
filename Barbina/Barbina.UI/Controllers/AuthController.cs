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
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            // E-mail e/ou senha não correspondem a nenhuma conta: limpamos os campos
            // para deixar claro que a tentativa falhou, em vez de um erro silencioso.
            _logger.LogWarning("Tentativa de login inválida para {Email}", model.Email);
            model.ErrorMessage = "E-mail ou senha inválidos.";
            model.Email = string.Empty;
            model.Senha = string.Empty;
            return View(model);
        }
        catch (Exception ex)
        {
            // Falha de comunicação com a API (serviço indisponível, timeout, etc.) — não é
            // um problema de credenciais, então preservamos o que o usuário já digitou.
            _logger.LogError(ex, "Falha ao tentar autenticar no admin");
            model.ErrorMessage = "Não foi possível conectar ao servidor. Tente novamente em alguns instantes.";
            model.Senha = string.Empty;
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
