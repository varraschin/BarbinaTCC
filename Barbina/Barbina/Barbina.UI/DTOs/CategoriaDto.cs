using System.Text.Json.Serialization;

namespace Barbina.UI.DTOs;

public class CategoriaDto
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("nome")] public string Nome { get; set; } = string.Empty;
    [JsonPropertyName("foto")] public string Foto { get; set; } = string.Empty;
    [JsonPropertyName("cor")] public string Cor { get; set; } = "rgba(0,0,0,1)";
}
