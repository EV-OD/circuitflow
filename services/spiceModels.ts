
export const STANDARD_MODELS: Record<string, string> = {
    // BJTs
    '2N2222': '.MODEL 2N2222 NPN (IS=14.34f XTI=3 EG=1.11 VAF=74.03 BF=255.9 NE=1.307 ISE=14.34f IKF=0.2847 XTB=1.5 BR=6.092 NC=2 ISC=0 IKR=0 RC=1 CJC=7.306p MJC=0.3416 VJC=0.75 FC=0.5 CJE=22.01p MJE=0.377 VJE=0.75 TR=46.91n TF=411.1p ITF=0.6 VTF=1.7 XTF=3 RB=10)',
    '2N3906': '.MODEL 2N3906 PNP (IS=1.41f XTI=3 EG=1.11 VAF=18.7 BF=180.7 NE=1.5 ISE=0 IKF=80m XTB=1.5 BR=4.977 NC=2 ISC=0 IKR=0 RC=2.5 CJC=9.728p MJC=0.5776 VJC=0.75 FC=0.5 CJE=8.063p MJE=0.3677 VJE=0.75 TR=33.42n TF=179.3p ITF=0.4 VTF=4 XTF=6 RB=10)',
    
    // Diodes
    'D1N4148': '.MODEL D1N4148 D (IS=2.682n N=1.836 BV=100 IBV=100n RS=0.56 CJO=4p TT=12n)',
    
    // MOSFETs (Generic Level 1 for basic logic/switching)
    'NMOS': '.MODEL NMOS NMOS (Level=1 KP=20u VTO=1 Lambda=0.02)',
    'PMOS': '.MODEL PMOS PMOS (Level=1 KP=10u VTO=-1 Lambda=0.02)',
    
    // OpAmps (Behavioral Subcircuit)
    'LM741': `.SUBCKT LM741 1 2 3 4 5
* Non-Inverting: 1, Inverting: 2, V+: 3, V-: 4, Output: 5
Rin 1 2 2Meg
* Gain Stage: VCCS taking input diff, driving internal node 6
E1 6 0 1 2 100k
* Output Resistance
Rout 6 5 75
.ENDS`
};
