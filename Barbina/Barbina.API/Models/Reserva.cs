using System.ComponentModel.DataAnnotations;

namespace Barbina.API.Models;

public class Reserva
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Telefone { get; set; } = string.Empty;

    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    /// <summary>Data da reserva (apenas a data, sem hora).</summary>
    [Required]
    public DateOnly Data { get; set; }

    /// <summary>Horário no formato HH:mm.</summary>
    [Required]
    [StringLength(5)]
    public string Hora { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Pessoas { get; set; } = string.Empty;

    /// <summary>"comum" (mesa) ou "evento".</summary>
    [StringLength(20)]
    public string Tipo { get; set; } = "comum";

    [StringLength(100)]
    public string TipoEvento { get; set; } = string.Empty;

    [StringLength(100)]
    public string Ambiente { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Observacoes { get; set; } = string.Empty;

    public bool Confirmada { get; set; } = false;

    public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
}
