using System.ComponentModel.DataAnnotations;

namespace Barbina.UI.ViewModels;

public class LoginViewModel
{
    private string _email = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
    [StringLength(256, ErrorMessage = "O e-mail deve ter no máximo {1} caracteres.")]
    [Display(Name = "E-mail")]
    public string Email
    {
        get => _email;
        // Espaços em branco no início/fim são removidos já no model binding,
        // antes das validações abaixo rodarem (evita falso "credenciais inválidas"
        // por um espaço extra colado junto com o e-mail).
        set => _email = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "A senha é obrigatória.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "A senha deve ter entre {2} e {1} caracteres.")]
    [DataType(DataType.Password)]
    [Display(Name = "Senha")]
    public string Senha { get; set; } = string.Empty;

    public string ReturnUrl { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
}
