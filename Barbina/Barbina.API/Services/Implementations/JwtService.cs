using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Barbina.API.Services.Interfaces;
using Barbina.API.DTOs;

namespace Barbina.API.Services.Implementations;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    public JwtService(IConfiguration configuration) { _configuration = configuration; }

    public string GenerateToken(UserDto user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, user.Nome),
            new Claim("foto", user.Foto ?? "/img/usuarios/no-photo.png"),
            new Claim(ClaimTypes.Role, user.Perfil),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"], audience: jwtSettings["Audience"],
            claims: claims, expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpirationInMinutes"]!)),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
