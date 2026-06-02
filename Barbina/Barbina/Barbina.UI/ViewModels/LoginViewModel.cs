using System.ComponentModel.DataAnnotations;

namespace Barbina.UI.ViewModels;

public class LoginViewModel
{
    [Required(ErrorMessage = "O email é obrigatório.")]
    [EmailAddress(ErrorMessage = "Email inválido.")]
    [Display(Name = "E-mail")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [DataType(DataType.Password)]
    [Display(Name = "Senha")]
    public string Senha { get; set; } = string.Empty;

    public string ReturnUrl { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}
