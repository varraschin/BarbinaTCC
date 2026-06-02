using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Barbina.UI.DTOs;
using Barbina.UI.Services.Interfaces;
using Barbina.UI.ViewModels;

namespace Barbina.UI.Controllers;

[Route("admin/produtos")]
public class ProdutosController : Controller
{
    private readonly IApiService _apiService;
    private readonly ILogger<ProdutosController> _logger;

    public ProdutosController(IApiService apiService, ILogger<ProdutosController> logger)
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

    private async Task<List<SelectListItem>> GetCategoriasSelectList(int selectedId = 0)
    {
        var cats = await _apiService.GetAsync<List<CategoriaDto>>("categorias");
        return cats.Select(c => new SelectListItem
        {
            Value = c.Id.ToString(),
            Text = c.Nome,
            Selected = c.Id == selectedId
        }).ToList();
    }

    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        InjectAdminToken();
        try
        {
            var produtos = await _apiService.GetAsync<List<ProdutoDto>>("produtos");
            ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
            ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
            return View(produtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao listar produtos");
            TempData["Erro"] = "Erro ao carregar produtos.";
            return View(new List<ProdutoDto>());
        }
    }

    [HttpGet("criar")]
    public async Task<IActionResult> Criar()
    {
        InjectAdminToken();
        var vm = new ProdutoViewModel
        {
            Categorias = await GetCategoriasSelectList()
        };
        ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
        ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
        return View(vm);
    }

    [HttpPost("criar")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Criar(ProdutoViewModel vm)
    {
        InjectAdminToken();
        if (!ModelState.IsValid)
        {
            vm.Categorias = await GetCategoriasSelectList(vm.CategoriaId);
            return View(vm);
        }
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(vm.CategoriaId.ToString()), "categoriaId");
            form.Add(new StringContent(vm.Nome), "nome");
            form.Add(new StringContent(vm.Descricao ?? ""), "descricao");
            form.Add(new StringContent(vm.Qtde.ToString()), "qtde");
            form.Add(new StringContent(vm.ValorCusto.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)), "valorCusto");
            form.Add(new StringContent(vm.ValorVenda.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)), "valorVenda");
            form.Add(new StringContent(vm.Destaque.ToString().ToLower()), "destaque");
            if (vm.Foto != null && vm.Foto.Length > 0)
            {
                var stream = vm.Foto.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(vm.Foto.ContentType);
                form.Add(fileContent, "foto", vm.Foto.FileName);
            }
            await _apiService.PostFormAsync<ProdutoDto>("produtos", form);
            TempData["Sucesso"] = "Produto criado com sucesso!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao criar produto");
            ModelState.AddModelError("", ex.Message);
            vm.Categorias = await GetCategoriasSelectList(vm.CategoriaId);
            return View(vm);
        }
    }

    [HttpGet("editar/{id}")]
    public async Task<IActionResult> Editar(int id)
    {
        InjectAdminToken();
        try
        {
            var p = await _apiService.GetAsync<ProdutoDto>($"produtos/{id}");
            var vm = new ProdutoViewModel
            {
                Id = p.Id,
                CategoriaId = p.CategoriaId,
                Nome = p.Nome,
                Descricao = p.Descricao,
                Qtde = p.Qtde,
                ValorCusto = p.ValorCusto,
                ValorVenda = p.ValorVenda,
                Destaque = p.Destaque,
                FotoAtual = p.Foto,
                CategoriaNome = p.CategoriaNome,
                Categorias = await GetCategoriasSelectList(p.CategoriaId)
            };
            ViewBag.AdminNome = HttpContext.Session.GetString("AdminNome");
            ViewBag.AdminFoto = HttpContext.Session.GetString("AdminFoto");
            return View(vm);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao buscar produto");
            TempData["Erro"] = "Produto não encontrado.";
            return RedirectToAction("Index");
        }
    }

    [HttpPost("editar/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Editar(int id, ProdutoViewModel vm)
    {
        InjectAdminToken();
        if (!ModelState.IsValid)
        {
            vm.Categorias = await GetCategoriasSelectList(vm.CategoriaId);
            return View(vm);
        }
        try
        {
            var form = new MultipartFormDataContent();
            form.Add(new StringContent(id.ToString()), "id");
            form.Add(new StringContent(vm.CategoriaId.ToString()), "categoriaId");
            form.Add(new StringContent(vm.Nome), "nome");
            form.Add(new StringContent(vm.Descricao ?? ""), "descricao");
            form.Add(new StringContent(vm.Qtde.ToString()), "qtde");
            form.Add(new StringContent(vm.ValorCusto.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)), "valorCusto");
            form.Add(new StringContent(vm.ValorVenda.ToString("F2", System.Globalization.CultureInfo.InvariantCulture)), "valorVenda");
            form.Add(new StringContent(vm.Destaque.ToString().ToLower()), "destaque");
            if (vm.Foto != null && vm.Foto.Length > 0)
            {
                var stream = vm.Foto.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(vm.Foto.ContentType);
                form.Add(fileContent, "foto", vm.Foto.FileName);
            }
            await _apiService.PutFormAsync<ProdutoDto>($"produtos/{id}", form);
            TempData["Sucesso"] = "Produto atualizado com sucesso!";
            return RedirectToAction("Index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao editar produto");
            ModelState.AddModelError("", ex.Message);
            vm.Categorias = await GetCategoriasSelectList(vm.CategoriaId);
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
            await _apiService.DeleteAsync($"produtos/{id}");
            TempData["Sucesso"] = "Produto excluído com sucesso!";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao excluir produto");
            TempData["Erro"] = ex.Message;
        }
        return RedirectToAction("Index");
    }
}
