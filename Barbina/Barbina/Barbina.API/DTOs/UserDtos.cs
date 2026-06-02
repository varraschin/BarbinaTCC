using System.ComponentModel.DataAnnotations;

namespace Barbina.API.DTOs;

public class RegisterDto
{
    [Required][EmailAddress] public string Email { get; set; }
    [Required][MinLength(6)] public string Senha { get; set; }
    [Required] public string Nome { get; set; }
    public DateTime? DataNascimento { get; set; }
    public IFormFile Foto { get; set; }
}

public class LoginDto
{
    [Required] public string Email { get; set; }
    [Required] public string Senha { get; set; }
}

public class UserDto
{
    public string Id { get; set; }
    public string Email { get; set; }
    public string Nome { get; set; }
    public DateTime? DataNascimento { get; set; }
    public string Foto { get; set; }
    public string Perfil { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public UserDto User { get; set; } = null!;
}
