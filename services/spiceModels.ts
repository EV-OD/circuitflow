
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
.ENDS`,

    'LF356': `
* LF356 Monolithic JFET-Input OP-AMP MACRO-MODEL
* connections: non-inverting input, inverting input, positive power supply, negative power supply, output
.SUBCKT LF356 1 2 99 50 28
IOS 2 1 3P
R1 1 3 1E12
R2 3 2 1E12
I1 99 4 100U
J1 5 2 4 JX
J2 6 7 4 JX
R3 5 50 20K
R4 6 50 20K
C4 5 6 1.9894E-13
I2 99 50 4.65MA
EOS 7 1 POLY(1) 16 49 3E-3 1
R8 99 49 50K
R9 49 50 50K
V2 99 8 2.63
D1 9 8 DX
D2 10 9 DX
V3 10 50 2.63
EH 99 98 99 49 1
F1 9 98 POLY(1) VA3 0 0 0 1.5944E7
G1 98 9 5 6 2E-3
R5 98 9 100MEG
VA3 9 11 0
C3 98 11 49.9798P
G4 98 16 3 49 1E-8
L2 98 17 530.52M
R13 17 16 1K
F6 99 50 VA7 1
F5 99 23 VA8 1
D5 21 23 DX
VA7 99 21 0
D6 23 99 DX
E1 99 26 99 9 1
VA8 26 27 0
R16 27 28 20
V5 28 25 -.25V
D4 25 9 DX
V4 24 28 -.25V
D3 9 24 DX
.MODEL DX D(IS=1E-15)
.MODEL JX PJF(BETA=1.25E-5 VTO=-2.00 IS=30E-12)
.ENDS
`,

    // Transformers
    // Added series resistance (Rp, Rs) to prevent "Voltage Source across Inductor" loops
    // Added isolation resistance (Riso) to prevent floating node errors on secondary
    'XFMR_NORMAL': `.subckt xfmr_normal p1 p2 s1 s2
.param Lp=100m  Ls=100m  Kcoeff=0.999 Rp=10m Rs=10m
R_pri p1 p_int {Rp}
L_pri p_int p2 {Lp}
R_sec s1 s_int {Rs}
L_sec s_int s2 {Ls}
K_main L_pri L_sec {Kcoeff}
R_iso p2 s2 100Meg
.ends xfmr_normal`,

    'XFMR_CT': `.subckt xfmr_ct p1 p2 s_top s_tap s_bot
.param Lp=100m  Ls=50m  Kcoeff=0.999 Rp=10m Rs=10m
R_pri p1 p_int {Rp}
L_pri p_int p2 {Lp}
R_sec1 s_top s_tap_int1 {Rs}
L_sec1 s_tap_int1 s_tap {Ls}
R_sec2 s_tap s_tap_int2 {Rs}
L_sec2 s_tap_int2 s_bot {Ls}
K1 L_pri L_sec1 {Kcoeff}
K2 L_pri L_sec2 {Kcoeff}
K3 L_sec1 L_sec2 {Kcoeff}
R_iso p2 s_tap 100Meg
.ends xfmr_ct`
};
