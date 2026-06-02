using Microsoft.AspNetCore.Identity;
using Barbina.API.DTOs;
using Barbina.API.Services.Interfaces;
using Barbina.API.Models;
using Barbina.API.Helpers;

namespace Barbina.API.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<Usuario> _userManager;
    private readonly SignInManager<Usuario> _signInManager;
    private readonly IJwtService _jwtService;
    private readonly IFileService _fileService;

    public AuthService(UserManager<Usuario> userManager, SignInManager<Usuario> signInManager, IJwtService jwtService, IFileService fileService)
    {
        _userManager = userManager; _signInManager = signInManager;
        _jwtService = jwtService; _fileService = fileService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
            throw new ArgumentException("Email já está em uso.");

        string fotoPath = null;
        if (registerDto.Foto != null) fotoPath = await _fileService.SaveFileAsync(registerDto.Foto, "img/usuarios");

        var user = new Usuario { UserName = registerDto.Email, Email = registerDto.Email, Nome = registerDto.Nome, DataNascimento = registerDto.DataNascimento, Foto = fotoPath };
        var result = await _userManager.CreateAsync(user, registerDto.Senha);
        if (!result.Succeeded)
        {
            if (fotoPath != null) await _fileService.DeleteFileAsync(fotoPath);
            throw new ArgumentException(string.Join(", ", result.Errors.Select(e => TranslateIdentityErrors.TranslateErrorMessage(e.Code))));
        }
        await _userManager.AddToRoleAsync(user, "Cliente");
        var userDto = await BuildUserDto(user);
        return new AuthResponseDto { Token = _jwtService.GenerateToken(userDto), Expiration = DateTime.UtcNow.AddMinutes(60), User = userDto };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email)
            ?? throw new UnauthorizedAccessException("Usuário e/ou Senha Inválidos.");
        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Senha, false);
        if (!result.Succeeded) throw new UnauthorizedAccessException("Usuário e/ou Senha Inválidos.");
        var userDto = await BuildUserDto(user);
        return new AuthResponseDto { Token = _jwtService.GenerateToken(userDto), Expiration = DateTime.UtcNow.AddMinutes(60), User = userDto };
    }

    public async Task<UserDto> GetUserByIdAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId) ?? throw new KeyNotFoundException("Usuário não encontrado.");
        return await BuildUserDto(user);
    }

    private async Task<UserDto> BuildUserDto(Usuario user) => new UserDto
    {
        Id = user.Id, Email = user.Email, Nome = user.Nome, DataNascimento = user.DataNascimento,
        Foto = !string.IsNullOrEmpty(user.Foto) ? _fileService.GetFileUrl(user.Foto) : null,
        Perfil = string.Join(", ", await _userManager.GetRolesAsync(user))
    };
}
