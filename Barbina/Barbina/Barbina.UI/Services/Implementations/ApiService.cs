using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Barbina.UI.Services.Interfaces;

namespace Barbina.UI.Services.Implementations;

public class ApiService : IApiService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ApiService> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ApiService(HttpClient httpClient, ILogger<ApiService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public void SetAuthToken(string token)
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    public async Task<T> GetAsync<T>(string endpoint)
    {
        var response = await _httpClient.GetAsync(endpoint);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(json, _jsonOptions)!;
    }

    public async Task<T> PostAsync<T>(string endpoint, object data)
    {
        var json = JsonSerializer.Serialize(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync(endpoint, content);
        var responseJson = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("API error {Status}: {Body}", response.StatusCode, responseJson);
            throw new HttpRequestException(ExtractErrorMessage(responseJson), null, response.StatusCode);
        }
        return JsonSerializer.Deserialize<T>(responseJson, _jsonOptions)!;
    }

    public async Task<T> PostFormAsync<T>(string endpoint, MultipartFormDataContent form)
    {
        var response = await _httpClient.PostAsync(endpoint, form);
        var responseJson = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException(ExtractErrorMessage(responseJson), null, response.StatusCode);
        return JsonSerializer.Deserialize<T>(responseJson, _jsonOptions)!;
    }

    public async Task<T> PutFormAsync<T>(string endpoint, MultipartFormDataContent form)
    {
        var response = await _httpClient.PutAsync(endpoint, form);
        var responseJson = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException(ExtractErrorMessage(responseJson), null, response.StatusCode);
        return JsonSerializer.Deserialize<T>(responseJson, _jsonOptions)!;
    }

    public async Task DeleteAsync(string endpoint)
    {
        var response = await _httpClient.DeleteAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException(ExtractErrorMessage(body), null, response.StatusCode);
        }
    }

    private static string ExtractErrorMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("message", out var msg))
                return msg.GetString() ?? "Erro desconhecido.";
        }
        catch { /* ignora */ }
        return "Erro na comunicação com a API.";
    }
}
