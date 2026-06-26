using Barbina.UI.DTOs;
using Barbina.UI.Services.Interfaces;
using Barbina.UI.ViewModels;

namespace Barbina.UI.Services.Implementations;

public class AuthUiService : IAuthUiService
{
    private readonly IApiService _apiService;

    public AuthUiService(IApiService apiService) { _apiService = apiService; }

    public async Task<AuthResponseDto> LoginAsync(LoginViewModel vm)
    {
        return await _apiService.PostAsync<AuthResponseDto>("auth/login", new
        {
            email = vm.Email,
            senha = vm.Senha
        });
    }
}
