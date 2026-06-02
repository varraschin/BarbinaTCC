using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Barbina.UI.ViewModels;

public class ProdutoViewModel
{
    public int Id { get; set; }
    [Required(ErrorMessage = "Categoria obrigatória.")]
    [Display(Name = "Categoria")]
    public int CategoriaId { get; set; }
    [Required(ErrorMessage = "Nome obrigatório.")]
    [StringLength(100)]
    [Display(Name = "Nome")]
    public string Nome { get; set; } = string.Empty;
    [StringLength(3000)]
    [Display(Name = "Descrição")]
    public string Descricao { get; set; } = string.Empty;
    [Required][Range(0, int.MaxValue)]
    [Display(Name = "Estoque")]
    public int Qtde { get; set; }
    [Required][Range(0, double.MaxValue)]
    [Display(Name = "Valor de Custo")]
    public decimal ValorCusto { get; set; }
    [Required][Range(0, double.MaxValue)]
    [Display(Name = "Valor de Venda")]
    public decimal ValorVenda { get; set; }
    [Display(Name = "Destaque")]
    public bool Destaque { get; set; }
    [Display(Name = "Foto")]
    public IFormFile Foto { get; set; }
    public string FotoAtual { get; set; } = string.Empty;
    public string CategoriaNome { get; set; } = string.Empty;
    public List<SelectListItem> Categorias { get; set; } = new();
}
