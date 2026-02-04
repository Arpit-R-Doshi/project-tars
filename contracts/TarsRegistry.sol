// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Simple Ownable implementation to avoid complex imports
contract Ownable {
    address public owner;
    constructor() { owner = msg.sender; }
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
}

contract TarsRegistry is Ownable {
    
    struct Report {
        uint256 id;
        string ipfsCid;      // The encrypted file location
        address reporter;    // Who sent it (can be anonymous/new wallet)
        uint256 timestamp;
        bool verified;
        bool flagged;
    }

    // Mappings
    mapping(uint256 => Report) public reports;
    mapping(address => uint256) public trustScores; // 0 to 100
    
    uint256 public reportCount;
    uint256 public constant INITIAL_SCORE = 50;

    // Events (Front-end will listen to these)
    event ReportSubmitted(uint256 indexed id, address indexed reporter, string ipfsCid);
    event ScoreUpdated(address indexed user, uint256 newScore);

    // --- Core Logic ---

    // 1. Submit a Report
    function submitReport(string memory _ipfsCid) public {
        // Initialize score if new user
        if (trustScores[msg.sender] == 0) {
            trustScores[msg.sender] = INITIAL_SCORE;
        }

        reportCount++;
        reports[reportCount] = Report({
            id: reportCount,
            ipfsCid: _ipfsCid,
            reporter: msg.sender,
            timestamp: block.timestamp,
            verified: false,
            flagged: false
        });

        emit ReportSubmitted(reportCount, msg.sender, _ipfsCid);
    }

    // 2. Admin: Verify Report (Increase Trust)
    function verifyReport(uint256 _id) public onlyOwner {
        require(_id <= reportCount, "Report does not exist");
        Report storage r = reports[_id];
        require(!r.verified, "Already verified");

        r.verified = true;
        
        // Increase score (+10), max 100
        address reporter = r.reporter;
        uint256 currentScore = trustScores[reporter];
        if (currentScore < 100) {
            trustScores[reporter] = currentScore + 10;
        }
        
        emit ScoreUpdated(reporter, trustScores[reporter]);
    }

    // 3. Admin: Flag Report (Decrease Trust)
    function flagReport(uint256 _id) public onlyOwner {
        require(_id <= reportCount, "Report does not exist");
        Report storage r = reports[_id];
        require(!r.flagged, "Already flagged");

        r.flagged = true;
        
        // Decrease score (-20), min 1
        address reporter = r.reporter;
        uint256 currentScore = trustScores[reporter];
        
        if (currentScore > 20) {
            trustScores[reporter] = currentScore - 20;
        } else {
            trustScores[reporter] = 1; // Minimum score
        }

        emit ScoreUpdated(reporter, trustScores[reporter]);
    }

    // Helper to get reporter score
    function getTrustScore(address _user) public view returns (uint256) {
        if (trustScores[_user] == 0) return INITIAL_SCORE;
        return trustScores[_user];
    }
}