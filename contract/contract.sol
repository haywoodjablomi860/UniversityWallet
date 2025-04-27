// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrgToken is ERC20, Ownable {
    mapping(address => bool) public admins;

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event UserTransfer(address indexed from, address indexed to, uint256 amount, address indexed admin);
    event UserBurn(address indexed from, uint256 amount, address indexed admin);

    constructor() ERC20("OrgToken", "ORG") Ownable(msg.sender) {
        // The deployer is set as an admin.
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "OrgToken: Caller is not an admin");
        _;
    }

    // Owner functions to manage admin accounts.
    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    /// Standard function: a user can burn their own tokens.
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// Standard transfer function inherited from ERC20 is available if needed.

    /// Admin function: mint tokens to the admin's own account.
    function mint(uint256 amount) external onlyAdmin {
        _mint(msg.sender, amount);
    }

    /// Admin function: mint tokens to any address.
    function mintTo(address to, uint256 amount) external onlyAdmin {
        _mint(to, amount);
    }

    /// Admin function: transfer tokens from one user to another.
    function transferFromUserToUser(
        address from,
        address to,
        uint256 amount
    ) external onlyAdmin {
        require(balanceOf(from) >= amount, "OrgToken: Insufficient balance");
        _transfer(from, to, amount);
        emit UserTransfer(from, to, amount, msg.sender);
    }

    /// Admin function: burn tokens from a specific user account.
    function adminBurn(address from, uint256 amount) external onlyAdmin {
        require(balanceOf(from) >= amount, "OrgToken: Insufficient balance");
        _burn(from, amount);
        emit UserBurn(from, amount, msg.sender);
    }
}
