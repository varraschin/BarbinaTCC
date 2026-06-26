using Microsoft.AspNetCore.Mvc;
using Barbina.UI.DTOs;
using Barbina.UI.Services.Interfaces;
using Barbina.UI.ViewModels;

namespace Barbina.UI.Controllers;

[Route("admin/categorias")]
public class CategoriasController : Controller
{
    private readonly IApiService _apiService;
    private readonly ILogger<CategoriasController> _logger;

    public CategoriasController(IApiService apiService, ILogger<CategoriasController> logger)
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
    public async Task<IActionResult> Index()
    {
        InjectAdminToken();
        try
        {
            var categorias = await _apiService.GetAsync<List<CategoriaDto>>("categorias");
            ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
            ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
            return View(categorias);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao listar categorias");
            TempData["Erro"] = "Erro ao carregar categorias.";
            return View(new List<CategoriaDto>());
        }
    }

    [HttpGet("criar")]
    public IActionResult Criar()
    {
        ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
        ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
        return View(new CategoriaViewModel());
    }

    [HttpPost("criar")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Criar(CategoriaViewModel vm)
    {
        if (!ModelState.IsValid) return View(vm);
        InjectAdminToken();
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(vm.Nome), "nome");
            form.Add(new StringContent(vm.Cor ?? "rgba(0,0,0,1)"), "cor");
            if (vm.Foto != null && vm.Foto.Length > 0)
            {
                var stream = vm.Foto.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(vm.Foto.ContentType);
                form.Add(fileContent, "foto", vm.Foto.FileName);
            }
            await _apiService.PostFormAsync<CategoriaDto>("categorias", form);
            TempData["Sucesso"] = "Categoria criada com sucesso!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar categoria");
            ModelState.AddModelError("", ex.Message);
            return View(vm);
        }
    }

    [HttpGet("editar/{id}")]
    public async Task<IActionResult> Editar(int id)
    {
        InjectAdminToken();
        try
        {
            var cat = await _apiService.GetAsync<CategoriaDto>($"categorias/{id}");
            var vm = new CategoriaViewModel
            {
                Id = cat.Id,
                Nome = cat.Nome,
                Cor = cat.Cor,
                FotoAtual = cat.Foto
            };
            ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
            ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
            return View(vm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar categoria");
            TempData["Erro"] = "Categoria não encontrada.";
            return RedirectToAction("Index");
        }
    }

    [HttpPost("editar/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Editar(int id, CategoriaViewModel vm)
    {
        if (!ModelState.IsValid) return View(vm);
        InjectAdminToken();
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(id.ToString()), "id");
            form.Add(new StringContent(vm.Nome), "nome");
            form.Add(new StringContent(vm.Cor ?? "rgba(0,0,0,1)"), "cor");
            if (vm.Foto != null && vm.Foto.Length > 0)
            {
                var stream = vm.Foto.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(vm.Foto.ContentType);
                form.Add(fileContent, "foto", vm.Foto.FileName);
            }
            await _apiService.PutFormAsync<CategoriaDto>($"categorias/{id}", form);
            TempData["Sucesso"] = "Categoria atualizada com sucesso!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao editar categoria");
            ModelState.AddModelError("", ex.Message);
            return View(vm);
        }
    }

    [HttpPost("excluir/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Excluir(int id)
    {
        InjectAdminToken();
        try
        {
            await _apiService.DeleteAsync($"categorias/{id}");
            TempData["Sucesso"] = "Categoria excluída com sucesso!";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir categoria");
            TempData["Erro"] = ex.Message;
        }
        return RedirectToAction("Index");
    }
}
