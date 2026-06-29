using System.ComponentModel.DataAnnotations;

namespace Barbina.API.DTOs;

public class ReservaDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateOnly Data { get; set; }
    public string Hora { get; set; } = string.Empty;
    public string Pessoas { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string TipoEvento { get; set; } = string.Empty;
    public string Ambiente { get; set; } = string.Empty;
    public string Observacoes { get; set; } = string.Empty;
    public bool Confirmada { get; set; }
    public DateTime CriadaEm { get; set; }
}

public class ReservaCreateDto
{
    [Required][StringLength(100)] public string Nome { get; set; } = string.Empty;
    [Required][StringLength(20)] public string Telefone { get; set; } = string.Empty;
    [StringLength(150)] public string Email { get; set; } = string.Empty;
    [Required] public DateOnly Data { get; set; }
    [Required][StringLength(5)] public string Hora { get; set; } = string.Empty;
    [Required][StringLength(20)] public string Pessoas { get; set; } = string.Empty;
    [StringLength(20)] public string Tipo { get; set; } = "comum";
    [StringLength(100)] public string TipoEvento { get; set; } = string.Empty;
    [StringLength(100)] public string Ambiente { get; set; } = string.Empty;
    [StringLength(1000)] public string Observacoes { get; set; } = string.Empty;
}
