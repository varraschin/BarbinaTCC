using System.ComponentModel.DataAnnotations;

namespace Barbina.UI.ViewModels;

public class CategoriaViewModel
{
    public int Id { get; set; }
    [Required(ErrorMessage = "Nome obrigatório.")]
    [StringLength(50, ErrorMessage = "Máximo 50 caracteres.")]
    [Display(Name = "Nome")]
    public string Nome { get; set; } = string.Empty;
    [Display(Name = "Cor")]
    public string Cor { get; set; } = "rgba(0,0,0,1)";
    [Display(Name = "Foto")]
    public IFormFile Foto { get; set; }
    public string FotoAtual { get; set; } = string.Empty;
}
