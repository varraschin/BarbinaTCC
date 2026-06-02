using Microsoft.AspNetCore.Mvc;
using Barbina.UI.DTOs;
using Barbina.UI.Services.Interfaces;

namespace Barbina.UI.Controllers;

public class HomeController : Controller
{
    private readonly IApiService _apiService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(IApiService apiService, ILogger<HomeController> logger)
    {
        _apiService = apiService;
        _logger = logger;
    }

    public async Task<IActionResult> Index()
    {
        try
        {
            var produtos = await _apiService.GetAsync<List<ProdutoDto>>("produtos/destaque");
            return View(produtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar destaques");
            return View(new List<ProdutoDto>());
        }
    }

    public async Task<IActionResult> Cardapio()
    {
        try
        {
            var categorias = await _apiService.GetAsync<List<CategoriaDto>>("categorias");
            var produtos = await _apiService.GetAsync<List<ProdutoDto>>("produtos");
            ViewBag.Categorias = categorias;
            return View(produtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar cardápio");
            ViewBag.Categorias = new List<CategoriaDto>();
            return View(new List<ProdutoDto>());
        }
    }

    public IActionResult Ambientes() => View();
    public IActionResult Reservas() => View();
    public IActionResult Contato() => View();

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new Models.ErrorViewModel { RequestId = System.Diagnostics.Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
