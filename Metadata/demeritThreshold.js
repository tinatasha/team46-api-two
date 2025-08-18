const DemeritMap = new Map();

//Set the thresholds as keys to get the associated standing status
//Essentially takes 30 demerit points across 30 months min to get blacklisted (Do this later cant think of a time friendly approach at the moemtn )
//For Now double the risks numbers
//High THreshold gives ample time to adjust and problems
DemeritMap.set(0, "Good");
DemeritMap.set(5, "Partial Risk");
DemeritMap.set(9, "High Risk");
DemeritMap.set(20, "BlackListed");

module.exports = { DemeritMap };
