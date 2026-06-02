using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Barbina.API.Data;
using Barbina.API.DTOs;
using Barbina.API.Models;
using Barbina.API.Services.Interfaces;

namespace Barbina.API.Controllers;

[Route("api/[controller]")][ApiController]
public class CategoriasController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileService _fileService;
    public CategoriasController(AppDbContext context, IFileService fileService) { _context = context; _fileService = fileService; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
    {
        var list = await _context.Categorias.ToListAsync();
        foreach (var c in list) if (!string.IsNullOrEmpty(c.Foto)) c.Foto = _fileService.GetFileUrl(c.Foto);
        return list;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Categoria>> GetCategoria(int id)
    {
        var cat = await _context.Categorias.FindAsync(id);
        if (cat == null) return NotFound();
        if (!string.IsNullOrEmpty(cat.Foto)) cat.Foto = _fileService.GetFileUrl(cat.Foto);
        return cat;
    }

    [HttpPost][Consumes("multipart/form-data")]
    public async Task<ActionResult<Categoria>> PostCategoria([FromForm] CategoriaCreateDto dto)
    {
        var cat = new Categoria { Nome = dto.Nome, Cor = dto.Cor ?? "rgba(0,0,0,1)" };
        if (dto.Foto != null && dto.Foto.Length > 0) cat.Foto = await _fileService.SaveFileAsync(dto.Foto, "img\\categorias");
        _context.Categorias.Add(cat);
        await _context.SaveChangesAsync();
        if (!string.IsNullOrEmpty(cat.Foto)) cat.Foto = _fileService.GetFileUrl(cat.Foto);
        return CreatedAtAction("GetCategoria", new { id = cat.Id }, cat);
    }

    [HttpPut("{id}")][Consumes("multipart/form-data")]
    public async Task<IActionResult> PutCategoria(int id, [FromForm] CategoriaUpdateDto dto)
    {
        if (id != dto.Id) return BadRequest();
        var cat = await _context.Categorias.FindAsync(id);
        if (cat == null) return NotFound();
        cat.Nome = dto.Nome; cat.Cor = dto.Cor;
        if (dto.Foto != null && dto.Foto.Length > 0)
        {
            if (!string.IsNullOrEmpty(cat.Foto)) await _fileService.DeleteFileAsync(cat.Foto);
            cat.Foto = await _fileService.SaveFileAsync(dto.Foto, "img\\categorias");
        }
        _context.Entry(cat).State = EntityState.Modified;
        try { await _context.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { if (!_context.Categorias.Any(e => e.Id == id)) return NotFound(); else throw; }
        if (!string.IsNullOrEmpty(cat.Foto)) cat.Foto = _fileService.GetFileUrl(cat.Foto);
        return Ok(cat);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategoria(int id)
    {
        var cat = await _context.Categorias.FindAsync(id);
        if (cat == null) return NotFound();
        if (!string.IsNullOrEmpty(cat.Foto)) await _fileService.DeleteFileAsync(cat.Foto);
        _context.Categorias.Remove(cat); await _context.SaveChangesAsync();
        return NoContent();
    }
}
