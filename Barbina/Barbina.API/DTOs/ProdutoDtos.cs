using System.ComponentModel.DataAnnotations;

namespace Barbina.API.DTOs;

public class ProdutoDto
{
    public int Id { get; set; }
    public int CategoriaId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public int Qtde { get; set; }
    public decimal ValorCusto { get; set; }
    public decimal ValorVenda { get; set; }
    public bool Destaque { get; set; }
    public string Foto { get; set; }
    public string CategoriaNome { get; set; }
}

public class ProdutoCreateDto
{
    [Required] public int CategoriaId { get; set; }
    [Required][StringLength(100)] public string Nome { get; set; } = string.Empty;
    [StringLength(3000)] public string Descricao { get; set; } = string.Empty;
    [Required][Range(0, int.MaxValue)] public int Qtde { get; set; }
    [Required][Range(0, double.MaxValue)] public decimal ValorCusto { get; set; }
    [Required][Range(0, double.MaxValue)] public decimal ValorVenda { get; set; }
    public bool Destaque { get; set; }
    public IFormFile Foto { get; set; }
}

public class ProdutoUpdateDto
{
    public int Id { get; set; }
    [Required] public int CategoriaId { get; set; }
    [Required][StringLength(100)] public string Nome { get; set; } = string.Empty;
    [StringLength(3000)] public string Descricao { get; set; } = string.Empty;
    [Required][Range(0, int.MaxValue)] public int Qtde { get; set; }
    [Required][Range(0, double.MaxValue)] public decimal ValorCusto { get; set; }
    [Required][Range(0, double.MaxValue)] public decimal ValorVenda { get; set; }
    public bool Destaque { get; set; }
    public IFormFile Foto { get; set; }
}
