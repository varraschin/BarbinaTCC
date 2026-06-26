namespace Barbina.UI.Services.Interfaces;

public interface IApiService
{
    Task<T> GetAsync<T>(string endpoint);
    Task<T> PostAsync<T>(string endpoint, object data);
    Task<T> PostFormAsync<T>(string endpoint, MultipartFormDataContent form);
    Task<T> PutFormAsync<T>(string endpoint, MultipartFormDataContent form);
    Task DeleteAsync(string endpoint);
    void SetAuthToken(string token);
}
