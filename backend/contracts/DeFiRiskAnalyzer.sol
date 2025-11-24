// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title DeFi Risk Analyzer (FHEVM)
/// @notice Single-contract encrypted DeFi risk scoring and portfolio recommendation.
/// @dev Mirrors Zama template patterns: uses FHE.fromExternal, FHE.allowThis, FHE.allow and returns ciphertext handles.
contract DeFiRiskAnalyzer is ZamaEthereumConfig {
    struct Result {
        euint32 riskScore;     // encrypted risk score
        euint8 riskLevel;      // 0=Low, 1=Medium, 2=High
        euint8 stablePct;      // portfolio suggestion percentages (0-100)
        euint8 bluechipPct;
        euint8 highRiskPct;
    }

    mapping(address => Result) private _results;

    /// @notice Submit encrypted profile and compute encrypted recommendations.
    /// @param cipherAssets Encrypted total assets (euint32)
    /// @param cipherRiskPref Encrypted risk preference (1..5) (euint32)
    /// @param cipherPositionVol Encrypted position volatility proxy (0..100) (euint32)
    /// @param inputProof Single proof matching all provided encrypted handles
    function analyze(
        externalEuint32 cipherAssets,
        externalEuint32 cipherRiskPref,
        externalEuint32 cipherPositionVol,
        bytes calldata inputProof
    ) external {
        // Import encrypted inputs
        euint32 assets = FHE.fromExternal(cipherAssets, inputProof);
        euint32 riskPref = FHE.fromExternal(cipherRiskPref, inputProof);
        euint32 posVol = FHE.fromExternal(cipherPositionVol, inputProof);

        // Normalize assets to reduce magnitude: assets / 1000
        euint32 normAssets = FHE.div(assets, 1000);

        // Dynamic risk preference weight based on level:
        // Level 1-2: weight 200, Level 3: weight 300, Level 4-5: weight 500
        ebool isLowLevel = FHE.le(riskPref, FHE.asEuint32(2));
        ebool isMidLevel = FHE.eq(riskPref, FHE.asEuint32(3));
        
        euint32 weightLow = FHE.asEuint32(200);
        euint32 weightMid = FHE.asEuint32(300);
        euint32 weightHigh = FHE.asEuint32(500);
        
        // Select weight: if <= 2 use 200, else if == 3 use 300, else use 500
        euint32 selectedWeight = FHE.select(isLowLevel, weightLow, 
            FHE.select(isMidLevel, weightMid, weightHigh));
        
        // riskScore = 1 * normAssets + (dynamic weight) * riskPref + 10 * posVol
        euint32 term1 = FHE.mul(normAssets, FHE.asEuint32(1));
        euint32 term2 = FHE.mul(riskPref, selectedWeight);
        euint32 term3 = FHE.mul(posVol, FHE.asEuint32(10));
        euint32 riskScore = FHE.add(FHE.add(term1, term2), term3);

        // Classify into Low / Medium / High using encrypted comparisons
        euint32 thrLow = FHE.asEuint32(1000);
        euint32 thrMed = FHE.asEuint32(2000);

        ebool isLow = FHE.le(riskScore, thrLow);
        ebool isMedOrLow = FHE.le(riskScore, thrMed);

        // Level: 0 (Low), 1 (Medium), 2 (High)
        euint32 levelMedOrHigh = FHE.select(isMedOrLow, FHE.asEuint32(1), FHE.asEuint32(2));
        euint32 level32 = FHE.select(isLow, FHE.asEuint32(0), levelMedOrHigh);
        euint8 level = FHE.asEuint8(level32);

        // Recommendations by level:
        // Low -> (70, 25, 5), Medium -> (40, 40, 20), High -> (20, 40, 40)
        euint32 stableMedOrHigh = FHE.select(isMedOrLow, FHE.asEuint32(40), FHE.asEuint32(20));
        euint32 blueMedOrHigh = FHE.asEuint32(40); // both med/high share 40
        euint32 highMedOrHigh = FHE.select(isMedOrLow, FHE.asEuint32(20), FHE.asEuint32(40));

        euint32 stable32 = FHE.select(isLow, FHE.asEuint32(70), stableMedOrHigh);
        euint32 blue32 = FHE.select(isLow, FHE.asEuint32(25), blueMedOrHigh);
        euint32 high32 = FHE.select(isLow, FHE.asEuint32(5), highMedOrHigh);

        euint8 stablePct = FHE.asEuint8(stable32);
        euint8 bluechipPct = FHE.asEuint8(blue32);
        euint8 highRiskPct = FHE.asEuint8(high32);

        // Save results under msg.sender
        _results[msg.sender] = Result({
            riskScore: riskScore,
            riskLevel: level,
            stablePct: stablePct,
            bluechipPct: bluechipPct,
            highRiskPct: highRiskPct
        });

        // Grant ACL to contract and caller for each newly created handle
        FHE.allowThis(_results[msg.sender].riskScore);
        FHE.allowThis(_results[msg.sender].riskLevel);
        FHE.allowThis(_results[msg.sender].stablePct);
        FHE.allowThis(_results[msg.sender].bluechipPct);
        FHE.allowThis(_results[msg.sender].highRiskPct);

        FHE.allow(_results[msg.sender].riskScore, msg.sender);
        FHE.allow(_results[msg.sender].riskLevel, msg.sender);
        FHE.allow(_results[msg.sender].stablePct, msg.sender);
        FHE.allow(_results[msg.sender].bluechipPct, msg.sender);
        FHE.allow(_results[msg.sender].highRiskPct, msg.sender);
    }

    /// @notice Returns the caller's encrypted risk score handle.
    function getRiskScore() external view returns (euint32) {
        return _results[msg.sender].riskScore;
    }

    /// @notice Returns the caller's encrypted risk level handle.
    /// @dev 0=Low, 1=Medium, 2=High
    function getRiskLevel() external view returns (euint8) {
        return _results[msg.sender].riskLevel;
    }

    /// @notice Returns the caller's encrypted recommended portfolio split.
    /// @return stable Stablecoin percentage (euint8)
    /// @return bluechip Bluechip percentage (euint8)
    /// @return highRisk High risk assets percentage (euint8)
    function getRecommendations() external view returns (euint8 stable, euint8 bluechip, euint8 highRisk) {
        Result storage r = _results[msg.sender];
        return (r.stablePct, r.bluechipPct, r.highRiskPct);
    }

    /// @notice Convenience getter: returns all encrypted outputs for the caller.
    function getAll()
        external
        view
        returns (euint32 riskScore, euint8 riskLevel, euint8 stablePct, euint8 bluechipPct, euint8 highRiskPct)
    {
        Result storage r = _results[msg.sender];
        return (r.riskScore, r.riskLevel, r.stablePct, r.bluechipPct, r.highRiskPct);
    }
}


