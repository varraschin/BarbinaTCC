using System.ComponentModel.DataAnnotations;

namespace Barbina.API.DTOs;

public class AmbienteDto
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Subtitulo { get; set; }
    public string Tag { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string Foto { get; set; }
    public string Secao { get; set; }
    public bool IsCarousel { get; set; }
    public bool IsActive { get; set; }
    public int? CarouselOrder { get; set; }
}

public class AmbienteCreateDto
{
    [Required][StringLength(100)] public string Titulo { get; set; } = string.Empty;
    [StringLength(150)] public string Subtitulo { get; set; }
    [StringLength(80)] public string Tag { get; set; }
    [StringLength(3000)] public string Descricao { get; set; } = string.Empty;
    [StringLength(50)] public string Secao { get; set; }
    public bool IsCarousel { get; set; }
    public IFormFile Foto { get; set; }
    /// <summary>Alternativa ao upload de arquivo: uma URL de imagem colada diretamente.</summary>
    public string FotoUrl { get; set; }
}

public class AmbienteUpdateDto
{
    public int Id { get; set; }
    [Required][StringLength(100)] public string Titulo { get; set; } = string.Empty;
    [StringLength(150)] public string Subtitulo { get; set; }
    [StringLength(80)] public string Tag { get; set; }
    [StringLength(3000)] public string Descricao { get; set; } = string.Empty;
    [StringLength(50)] public string Secao { get; set; }
    public bool IsCarousel { get; set; }
    public IFormFile Foto { get; set; }
    public string FotoUrl { get; set; }
}

public class AmbienteSetActiveDto
{
    public bool IsActive { get; set; }
}
