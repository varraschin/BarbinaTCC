using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Barbina.API.Data;
using Barbina.API.Models;
using Barbina.API.Services.Interfaces;
using Barbina.API.DTOs;

namespace Barbina.API.Controllers;

[Route("api/[controller]")][ApiController]
public class ProdutosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileService _fileService;
    public ProdutosController(AppDbContext context, IFileService fileService) { _context = context; _fileService = fileService; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProdutoDto>>> GetProdutos()
        => Ok((await _context.Produtos.Include(p => p.Categoria).ToListAsync()).Select(MapToDto));

    [HttpGet("{id}")]
    public async Task<ActionResult<ProdutoDto>> GetProduto(int id)
    {
        var p = await _context.Produtos.Include(x => x.Categoria).FirstOrDefaultAsync(x => x.Id == id);
        return p == null ? NotFound() : Ok(MapToDto(p));
    }

    [HttpGet("categoria/{categoriaId}")]
    public async Task<ActionResult<IEnumerable<ProdutoDto>>> GetPorCategoria(int categoriaId)
        => Ok((await _context.Produtos.Include(p => p.Categoria).Where(p => p.CategoriaId == categoriaId).ToListAsync()).Select(MapToDto));

    [HttpGet("destaque")]
    public async Task<ActionResult<IEnumerable<ProdutoDto>>> GetDestaque()
        => Ok((await _context.Produtos.Include(p => p.Categoria).Where(p => p.Destaque).ToListAsync()).Select(MapToDto));

    [HttpPost][Consumes("multipart/form-data")]
    public async Task<ActionResult<ProdutoDto>> PostProduto([FromForm] ProdutoCreateDto dto)
    {
        var p = new Produto { CategoriaId = dto.CategoriaId, Nome = dto.Nome, Descricao = dto.Descricao, Qtde = dto.Qtde, ValorCusto = dto.ValorCusto, ValorVenda = dto.ValorVenda, Destaque = dto.Destaque };
        if (dto.Foto != null && dto.Foto.Length > 0) p.Foto = await _fileService.SaveFileAsync(dto.Foto, "img\\produtos");
        _context.Produtos.Add(p); await _context.SaveChangesAsync();
        await _context.Entry(p).Reference(x => x.Categoria).LoadAsync();
        return CreatedAtAction("GetProduto", new { id = p.Id }, MapToDto(p));
    }

    [HttpPut("{id}")][Consumes("multipart/form-data")]
    public async Task<IActionResult> PutProduto(int id, [FromForm] ProdutoUpdateDto dto)
    {
        if (id != dto.Id) return BadRequest();
        var p = await _context.Produtos.FindAsync(id);
        if (p == null) return NotFound();
        p.CategoriaId = dto.CategoriaId; p.Nome = dto.Nome; p.Descricao = dto.Descricao;
        p.Qtde = dto.Qtde; p.ValorCusto = dto.ValorCusto; p.ValorVenda = dto.ValorVenda; p.Destaque = dto.Destaque;
        if (dto.Foto != null && dto.Foto.Length > 0)
        {
            if (!string.IsNullOrEmpty(p.Foto)) await _fileService.DeleteFileAsync(p.Foto);
            p.Foto = await _fileService.SaveFileAsync(dto.Foto, "img\\produtos");
        }
        _context.Entry(p).State = EntityState.Modified;
        try { await _context.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!_context.Produtos.Any(e => e.Id == id)) return NotFound(); else throw; }
        return Ok(MapToDto(p));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduto(int id)
    {
        var p = await _context.Produtos.FindAsync(id);
        if (p == null) return NotFound();
        if (!string.IsNullOrEmpty(p.Foto)) await _fileService.DeleteFileAsync(p.Foto);
        _context.Produtos.Remove(p); await _context.SaveChangesAsync();
        return NoContent();
    }

    private ProdutoDto MapToDto(Produto p) => new()
    {
        Id = p.Id, CategoriaId = p.CategoriaId, Nome = p.Nome, Descricao = p.Descricao,
        Qtde = p.Qtde, ValorCusto = p.ValorCusto, ValorVenda = p.ValorVenda, Destaque = p.Destaque,
        Foto = !string.IsNullOrEmpty(p.Foto) ? _fileService.GetFileUrl(p.Foto) : null,
        CategoriaNome = p.Categoria?.Nome
    };
}
