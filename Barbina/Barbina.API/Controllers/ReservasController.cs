using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Barbina.API.Data;
using Barbina.API.DTOs;
using Barbina.API.Models;

namespace Barbina.API.Controllers;

[Route("api/[controller]")][ApiController]
public class ReservasController : ControllerBase
{
    private readonly AppDbContext _context;
    public ReservasController(AppDbContext context) { _context = context; }

    /// <summary>Lista reservas, opcionalmente filtradas por uma data específica (uso do painel admin).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReservaDto>>> GetReservas([FromQuery] DateOnly? data)
    {
        var query = _context.Reservas.AsQueryable();
        if (data.HasValue) query = query.Where(r => r.Data == data.Value);
        var lista = await query.OrderBy(r => r.Hora).ToListAsync();
        return Ok(lista.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservaDto>> GetReserva(int id)
    {
        var r = await _context.Reservas.FindAsync(id);
        return r == null ? NotFound() : Ok(MapToDto(r));
    }

    /// <summary>Endpoint público: usado pelo formulário de reservas do site, sem autenticação.</summary>
    [HttpPost]
    public async Task<ActionResult<ReservaDto>> PostReserva([FromBody] ReservaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var r = new Reserva
        {
            Nome = dto.Nome,
            Telefone = dto.Telefone,
            Email = dto.Email ?? string.Empty,
            Data = dto.Data,
            Hora = dto.Hora,
            Pessoas = dto.Pessoas,
            Tipo = string.IsNullOrWhiteSpace(dto.Tipo) ? "comum" : dto.Tipo,
            TipoEvento = dto.TipoEvento ?? string.Empty,
            Ambiente = dto.Ambiente ?? string.Empty,
            Observacoes = dto.Observacoes ?? string.Empty,
            Confirmada = false,
            CriadaEm = DateTime.UtcNow
        };

        _context.Reservas.Add(r);
        await _context.SaveChangesAsync();
        return CreatedAtAction("GetReserva", new { id = r.Id }, MapToDto(r));
    }

    /// <summary>Marca a reserva como confirmada (uso exclusivo do painel admin).</summary>
    [HttpPatch("{id}/confirmar")]
    public async Task<IActionResult> Confirmar(int id)
    {
        var r = await _context.Reservas.FindAsync(id);
        if (r == null) return NotFound();
        r.Confirmada = true;
        await _context.SaveChangesAsync();
        return Ok(MapToDto(r));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReserva(int id)
    {
        var r = await _context.Reservas.FindAsync(id);
        if (r == null) return NotFound();
        _context.Reservas.Remove(r);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static ReservaDto MapToDto(Reserva r) => new()
    {
        Id = r.Id, Nome = r.Nome, Telefone = r.Telefone, Email = r.Email,
        Data = r.Data, Hora = r.Hora, Pessoas = r.Pessoas, Tipo = r.Tipo,
        TipoEvento = r.TipoEvento, Ambiente = r.Ambiente, Observacoes = r.Observacoes,
        Confirmada = r.Confirmada, CriadaEm = r.CriadaEm
    };
}
