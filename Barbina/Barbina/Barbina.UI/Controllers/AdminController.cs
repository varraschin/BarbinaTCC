using Microsoft.AspNetCore.Mvc;
using Barbina.UI.DTOs;
using Barbina.UI.Services.Interfaces;

namespace Barbina.UI.Controllers;

[Route("admin")]
public class AdminController : Controller
{
    private readonly IApiService _apiService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(IApiService apiService, ILogger<AdminController> logger)
    {
        _apiService = apiService;
        _logger = logger;
    }

    private void InjectAdminToken()
    {
        var token = HttpContext.Session.GetString("AdminToken");
        if (!string.IsNullOrEmpty(token))
            _apiService.SetAuthToken(token);
    }

    [HttpGet("")]
    [HttpGet("index")]
    public async Task<IActionResult> Index()
    {
        InjectAdminToken();
        try
        {
            var produtos = await _apiService.GetAsync<List<ProdutoDto>>("produtos");
            var categorias = await _apiService.GetAsync<List<CategoriaDto>>("categorias");
            ViewBag.TotalProdutos = produtos.Count;
            ViewBag.TotalCategorias = categorias.Count;
            ViewBag.TotalEstoque = produtos.Sum(p => p.Qtde);
            ViewBag.ValorEstoque = produtos.Sum(p => p.Qtde * p.ValorVenda);
            ViewBag.Destaques = produtos.Count(p => p.Destaque);
            ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
            ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
            return View();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao carregar dashboard");
            return View();
        }
    }
}
