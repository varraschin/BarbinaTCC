using System.ComponentModel.DataAnnotations;

namespace Barbina.API.DTOs;

public class CategoriaCreateDto
{
    [Required][StringLength(50)] public string Nome { get; set; } = string.Empty;
    [StringLength(26)] public string Cor { get; set; }
    public IFormFile Foto { get; set; }
}

public class CategoriaUpdateDto
{
    public int Id { get; set; }
    [Required][StringLength(50)] public string Nome { get; set; } = string.Empty;
    [StringLength(26)] public string Cor { get; set; }
    public IFormFile Foto { get; set; }
}
