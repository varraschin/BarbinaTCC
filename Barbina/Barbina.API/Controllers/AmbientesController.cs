using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Barbina.API.Data;
using Barbina.API.DTOs;
using Barbina.API.Models;
using Barbina.API.Services.Interfaces;

namespace Barbina.API.Controllers;

[Route("api/[controller]")][ApiController]
public class AmbientesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileService _fileService;
    public AmbientesController(AppDbContext context, IFileService fileService) { _context = context; _fileService = fileService; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AmbienteDto>>> GetAmbientes()
        => Ok((await _context.Ambientes.ToListAsync()).Select(MapToDto));

    [HttpGet("{id}")]
    public async Task<ActionResult<AmbienteDto>> GetAmbiente(int id)
    {
        var a = await _context.Ambientes.FindAsync(id);
        return a == null ? NotFound() : Ok(MapToDto(a));
    }

    [HttpGet("carrossel")]
    public async Task<ActionResult<IEnumerable<AmbienteDto>>> GetCarrossel()
        => Ok((await _context.Ambientes
                .Where(a => a.IsCarousel)
                .OrderBy(a => a.CarouselOrder)
                .ToListAsync())
            .Select(MapToDto));

    [HttpGet("galeria")]
    public async Task<ActionResult<IEnumerable<AmbienteDto>>> GetGaleria()
        => Ok((await _context.Ambientes.Where(a => !a.IsCarousel).ToListAsync()).Select(MapToDto));

    [HttpPost][Consumes("multipart/form-data")]
    public async Task<ActionResult<AmbienteDto>> PostAmbiente([FromForm] AmbienteCreateDto dto)
    {
        var a = new Ambiente
        {
            Titulo = dto.Titulo,
            Subtitulo = dto.Subtitulo,
            Tag = dto.Tag,
            Descricao = dto.Descricao ?? string.Empty,
            Secao = dto.IsCarousel ? null : dto.Secao,
            IsCarousel = dto.IsCarousel
        };

        await AplicarFotoAsync(a, dto.Foto, dto.FotoUrl);

        if (dto.IsCarousel)
        {
            var maxOrder = await _context.Ambientes.Where(x => x.IsCarousel).MaxAsync(x => (int?)x.CarouselOrder) ?? 0;
            a.CarouselOrder = maxOrder + 1;
        }

        _context.Ambientes.Add(a);
        await _context.SaveChangesAsync();

        if (!a.IsCarousel) await AutoAtivarSeUnicaAsync(a.Secao);

        return CreatedAtAction("GetAmbiente", new { id = a.Id }, MapToDto(a));
    }

    [HttpPut("{id}")][Consumes("multipart/form-data")]
    public async Task<IActionResult> PutAmbiente(int id, [FromForm] AmbienteUpdateDto dto)
    {
        if (id != dto.Id) return BadRequest();
        var a = await _context.Ambientes.FindAsync(id);
        if (a == null) return NotFound();

        var secaoAntiga = a.Secao;

        a.Titulo = dto.Titulo;
        a.Subtitulo = dto.Subtitulo;
        a.Tag = dto.Tag;
        a.Descricao = dto.Descricao ?? string.Empty;
        a.IsCarousel = dto.IsCarousel;
        a.Secao = dto.IsCarousel ? null : dto.Secao;

        await AplicarFotoAsync(a, dto.Foto, dto.FotoUrl);

        if (dto.IsCarousel && a.CarouselOrder == null)
        {
            var maxOrder = await _context.Ambientes.Where(x => x.IsCarousel && x.Id != id).MaxAsync(x => (int?)x.CarouselOrder) ?? 0;
            a.CarouselOrder = maxOrder + 1;
        }
        else if (!dto.IsCarousel)
        {
            a.CarouselOrder = null;
        }

        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) { if (!_context.Ambientes.Any(e => e.Id == id)) return NotFound(); else throw; }

        if (!a.IsCarousel)
        {
            if (!string.IsNullOrEmpty(secaoAntiga) && secaoAntiga != a.Secao) await AutoAtivarSeUnicaAsync(secaoAntiga);
            await AutoAtivarSeUnicaAsync(a.Secao);
        }

        return Ok(MapToDto(a));
    }

    /// <summary>Marca/desmarca esta imagem como a exibida no site para a sua seção (no máximo uma ativa por seção).</summary>
    [HttpPatch("{id}/ativa")]
    public async Task<IActionResult> SetAtiva(int id, [FromBody] AmbienteSetActiveDto dto)
    {
        var a = await _context.Ambientes.FindAsync(id);
        if (a == null || a.IsCarousel || string.IsNullOrEmpty(a.Secao)) return NotFound();

        if (dto.IsActive)
        {
            var outras = await _context.Ambientes.Where(x => !x.IsCarousel && x.Secao == a.Secao && x.Id != id).ToListAsync();
            foreach (var o in outras) o.IsActive = false;
            a.IsActive = true;
        }
        else
        {
            a.IsActive = false;
        }

        await _context.SaveChangesAsync();
        return Ok(MapToDto(a));
    }

    /// <summary>Remove um slide apenas do carrossel, sem excluir o registro (passa a ser só um item de galeria, se tiver seção).</summary>
    [HttpPatch("{id}/remover-carrossel")]
    public async Task<IActionResult> RemoverDoCarrossel(int id)
    {
        var a = await _context.Ambientes.FindAsync(id);
        if (a == null) return NotFound();
        a.IsCarousel = false;
        a.CarouselOrder = null;
        await _context.SaveChangesAsync();
        return Ok(MapToDto(a));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAmbiente(int id)
    {
        var a = await _context.Ambientes.FindAsync(id);
        if (a == null) return NotFound();
        var secao = a.Secao;
        var eraCarrossel = a.IsCarousel;
        _context.Ambientes.Remove(a);
        await _context.SaveChangesAsync();
        if (!eraCarrossel) await AutoAtivarSeUnicaAsync(secao);
        return NoContent();
    }

    private async Task AplicarFotoAsync(Ambiente a, IFormFile foto, string fotoUrl)
    {
        if (foto != null && foto.Length > 0)
        {
            a.Foto = await _fileService.SaveFileAsync(foto, "img\\ambientes");
        }
        else if (!string.IsNullOrWhiteSpace(fotoUrl))
        {
            a.Foto = fotoUrl.Trim();
        }
    }

    /// <summary>Se, após a operação, a seção tiver exatamente uma imagem cadastrada, ela é ativada automaticamente.</summary>
    private async Task AutoAtivarSeUnicaAsync(string secao)
    {
        if (string.IsNullOrEmpty(secao)) return;
        var itens = await _context.Ambientes.Where(x => !x.IsCarousel && x.Secao == secao).ToListAsync();
        if (itens.Count == 1)
        {
            itens[0].IsActive = true;
            await _context.SaveChangesAsync();
        }
    }

    private AmbienteDto MapToDto(Ambiente a) => new()
    {
        Id = a.Id, Titulo = a.Titulo, Subtitulo = a.Subtitulo, Tag = a.Tag, Descricao = a.Descricao,
        Foto = ResolveFotoUrl(a.Foto), Secao = a.Secao, IsCarousel = a.IsCarousel, IsActive = a.IsActive,
        CarouselOrder = a.CarouselOrder
    };

    /// <summary>As fotos de Ambiente podem ser uma URL externa (colada pelo admin) ou um arquivo enviado (caminho relativo); só o segundo caso precisa virar URL absoluta da API.</summary>
    private string ResolveFotoUrl(string foto)
    {
        if (string.IsNullOrEmpty(foto)) return null;
        if (foto.StartsWith("http://") || foto.StartsWith("https://")) return foto;
        return _fileService.GetFileUrl(foto);
    }
}
