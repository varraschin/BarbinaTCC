using System.ComponentModel.DataAnnotations;

namespace Barbina.API.Models;

/// <summary>
/// Representa tanto um slide do carrossel da página Ambientes quanto uma imagem
/// da Galeria de Ambientes (story-item). O campo <see cref="IsCarousel"/> diferencia
/// os dois usos; os demais campos são preenchidos conforme o contexto.
/// </summary>
public class Ambiente
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Titulo { get; set; } = string.Empty;

    /// <summary>Subtítulo exibido junto ao ambiente na Galeria (não usado no carrossel).</summary>
    [StringLength(150)]
    public string Subtitulo { get; set; }

    /// <summary>Texto pequeno exibido sobre a imagem no carrossel (ex: "Elegância &amp; Sofisticação").</summary>
    [StringLength(80)]
    public string Tag { get; set; }

    [StringLength(3000)]
    public string Descricao { get; set; } = string.Empty;

    public string Foto { get; set; }

    /// <summary>Uma das 4 seções fixas da página Ambientes (Salão Principal, Área de Balcão, Espaço Privativo, Cozinha Show). Vazio quando é um item exclusivo de carrossel.</summary>
    [StringLength(50)]
    public string Secao { get; set; }

    public bool IsCarousel { get; set; } = false;

    /// <summary>Quando true, é a imagem exibida na seção correspondente da Galeria (apenas uma por seção).</summary>
    public bool IsActive { get; set; } = false;

    /// <summary>Posição no carrossel (apenas relevante quando IsCarousel = true).</summary>
    public int? CarouselOrder { get; set; }
}
