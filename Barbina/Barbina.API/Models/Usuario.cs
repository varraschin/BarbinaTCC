using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace Barbina.API.Models;

public class Usuario : IdentityUser
{
    [Required][StringLength(50)]
    public string Nome { get; set; } = string.Empty;
    public DateTime? DataNascimento { get; set; }
    public string Foto { get; set; } = "/img/usuarios/avatar.png";
}
