import React, { useState, useMemo, useEffect } from 'react';

// Default incidence rate
const DEFAULT_INCIDENCE = "0.5"; // per 1000 live births

const LIKELIHOOD_RATIOS = {
  gestationalAge: {
    '\u226542': 1.4,
    '41 0/7-41 6/7': 1.1,
    '40 0/7-40 6/7': 0.8,
    '39 0/7-39 6/7': 0.6,
    '38 0/7-38 6/7': 0.5,
    '37 0/7-37 6/7': 0.4,
    '36 0/7-36 6/7': 0.7,
    '35 0/7-35 6/7': 1.3,
    '\u226434 6/7': 2.3,
  },
  rom: {
    '<12': 0.6,
    '12-18': 1.3,
    '18-24': 1.7,
    '>24': 2.1,
  },
  highestTemp: {
    '<38': 0.4,
    '\u226538': 3.7,
  },
  gbsStatus: {
    'positive': 2.0,
    'negative': 0.4,
    'unknown': 1.0,
  },
  iap: {
    'adequate_pen_amp': 0.2,
    'adequate_cefazolin': 0.4,
    'adequate_clinda_vanco': 0.9,
    'inadequate_or_no': 1.0,
    'no_iap_needed': 1.0,
  },
};


const App = () => {
  // Brand colors for WashU School of Medicine
  const washuRed = '#A51417';
  const washuGray = '#747474';

  // State for all input fields
  const [incidence, setIncidence] = useState(DEFAULT_INCIDENCE);
  const [gestationalAge, setGestationalAge] = useState('\u226542');
  const [highestTemp, setHighestTemp] = useState('<38');
  const [rom, setRom] = useState('<12');
  const [gbsStatus, setGbsStatus] = useState('negative');
  const [iap, setIap] = useState('no_iap_needed');

  // Memoized calculation for sepsis risk
  const sepsisRisk = useMemo(() => {
    const numericIncidence = parseFloat(incidence);
    if (isNaN(numericIncidence) || numericIncidence <= 0) return '0.00';
    
    const priorOdds = numericIncidence / (1000 - numericIncidence);

    const lrGestationalAge = LIKELIHOOD_RATIOS.gestationalAge[gestationalAge];
    const lrHighestTemp = LIKELIHOOD_RATIOS.highestTemp[highestTemp];
    const lrRom = LIKELIHOOD_RATIOS.rom[rom];
    const lrGbsStatus = LIKELIHOOD_RATIOS.gbsStatus[gbsStatus];
    const lrIap = iap === 'no_iap_needed' || gbsStatus !== 'positive' ? 1.0 : LIKELIHOOD_RATIOS.iap[iap];
    
    const combinedLR = lrGestationalAge * lrHighestTemp * lrRom * lrGbsStatus * lrIap;
    const posteriorOdds = priorOdds * combinedLR;
    const posteriorProbability = posteriorOdds / (1 + posteriorOdds);

    return (posteriorProbability * 1000).toFixed(2);
  }, [incidence, gestationalAge, highestTemp, rom, gbsStatus, iap]);

  // Determine recommendation based on calculated risk
  const recommendation = useMemo(() => {
    const risk = parseFloat(sepsisRisk);
    if (risk > 1.18) return { text: 'Empiric Antibiotics Recommended', color: 'bg-red-500' };
    if (risk >= 0.65 && risk <= 1.18) return { text: 'Enhanced Vital Signs', color: 'bg-yellow-500' };
    return { text: 'Routine Care', color: 'bg-green-500' };
  }, [sepsisRisk]);
    
  // Reset calculator to initial state
  const handleReset = () => {
    setIncidence(DEFAULT_INCIDENCE);
    setGestationalAge('\u226542');
    setHighestTemp('<38');
    setRom('<12');
    setGbsStatus('negative');
    setIap('no_iap_needed');
  };
  
  // Effect to handle GBS status change
  useEffect(() => {
    if (gbsStatus !== 'positive') {
        setIap('no_iap_needed');
    }
  }, [gbsStatus]);

  // Component for select dropdowns
  const SelectInput = ({ label, value, onChange, options, helpText, disabled = false }) => (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <select 
        className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${disabled ? 'bg-gray-200 cursor-not-allowed' : ''}`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {Object.entries(options).map(([key, displayValue]) => (
          <option key={key} value={key}>{displayValue}</option>
        ))}
      </select>
      {helpText && <p className="text-xs" style={{color: washuGray}}>{helpText}</p>}
    </div>
  );

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;700;900&display=swap');
          body { font-family: 'Libre Franklin', sans-serif; }
        `}
      </style>
      <div className="bg-gray-100 min-h-screen">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <img 
              src="https://marcomm.med.washu.edu/app/uploads/2024/08/logo-graphic.png" 
              alt="Washington University School of Medicine Logo"
              className="h-16"
              onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/300x60/A51417/FFFFFF?text=WUSM'; }}
            />
          </div>
          <div className="container mx-auto px-4 pb-4">
            <h1 className="text-3xl font-black" style={{color: washuRed}}>Neonatal Early-Onset Sepsis Calculator</h1>
            <p style={{color: washuGray}}>For infants \u226534 weeks gestation</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                   <h2 className="text-2xl font-bold" style={{color: washuGray}}>Risk Factors</h2>
                   <button 
                     type="button" 
                     onClick={handleReset} 
                     className="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                     style={{backgroundColor: washuGray, hover: {backgroundColor: '#555'}}}>
                    Reset
                  </button>
              </div>
              <div>
                <SelectInput
                    label="Incidence of Early-Onset Sepsis"
                    value={incidence}
                    onChange={(e) => setIncidence(e.target.value)}
                    options={{
                        "0.2": "0.2 / 1000 births",
                        "0.3": "0.3 / 1000 births",
                        "0.5": "0.5 / 1000 births (Typical)",
                        "0.7": "0.7 / 1000 births",
                        "1.0": "1.0 / 1000 births",
                    }}
                    helpText="Set the baseline sepsis incidence for your population."
                />
                <SelectInput
                  label="Gestational Age at Delivery"
                  value={gestationalAge}
                  onChange={(e) => setGestationalAge(e.target.value)}
                  options={{
                      '\u226434 6/7': '\u226434 6/7 weeks',
                      '35 0/7-35 6/7': '35 0/7-35 6/7 weeks',
                      '36 0/7-36 6/7': '36 0/7-36 6/7 weeks',
                      '37 0/7-37 6/7': '37 0/7-37 6/7 weeks',
                      '38 0/7-38 6/7': '38 0/7-38 6/7 weeks',
                      '39 0/7-39 6/7': '39 0/7-39 6/7 weeks',
                      '40 0/7-40 6/7': '40 0/7-40 6/7 weeks',
                      '41 0/7-41 6/7': '41 0/7-41 6/7 weeks',
                      '\u226542': '\u226542 weeks'
                  }}
                />
                <SelectInput
                  label="Highest Antepartum/Intrapartum Maternal Temperature (\u00b0C)"
                  value={highestTemp}
                  onChange={(e) => setHighestTemp(e.target.value)}
                  options={{ '<38': '< 38.0 \u00b0C (100.4 \u00b0F)', '\u226538': '\u2265 38.0 \u00b0C (100.4 \u00b0F)' }}
                />
                <SelectInput
                  label="Duration of Rupture of Membranes (ROM)"
                  value={rom}
                  onChange={(e) => setRom(e.target.value)}
                  options={{ '<12': '< 12 hours', '12-18': '12 to < 18 hours', '18-24': '18 to < 24 hours', '>24': '\u2265 24 hours' }}
                />
                <SelectInput
                  label="Group B Strep (GBS) Status"
                  value={gbsStatus}
                  onChange={(e) => setGbsStatus(e.target.value)}
                  options={{ 'positive': 'Positive', 'negative': 'Negative', 'unknown': 'Unknown' }}
                />
                <SelectInput
                    label="Intrapartum Antibiotics (IAP)"
                    value={iap}
                    onChange={(e) => setIap(e.target.value)}
                    options={{
                      'no_iap_needed': 'Not Applicable (GBS Negative/Unknown)',
                      'adequate_pen_amp': '\u2265 4 hrs of Penicillin or Ampicillin before delivery',
                      'adequate_cefazolin': '\u2265 4 hrs of Cefazolin before delivery',
                      'adequate_clinda_vanco': '\u2265 4 hrs of Clindamycin or Vancomycin before delivery',
                      'inadequate_or_no': 'Inadequate or no IAP before delivery'
                    }}
                    helpText="This field is only applicable if GBS status is positive."
                    disabled={gbsStatus !== 'positive'}
                  />
              </div>
            </div>

            {/* Results Display */}
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
               <h2 className="text-2xl font-bold mb-4 text-center" style={{color: washuGray}}>Recommendation</h2>
                  <div className={`w-full text-white text-center p-4 rounded-lg text-xl font-bold ${recommendation.color} transition-colors duration-300`}>
                    {recommendation.text}
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-gray-800 text-lg">Calculated Sepsis Risk:</p>
                    <p className="text-5xl font-black my-2" style={{color: washuRed}}>{sepsisRisk}</p>
                    <p className="text-gray-600 text-lg">per 1000 live births</p>
                  </div>
               <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                    <h3 className="font-bold mb-2" style={{color: washuGray}}>Clinical Recommendations Key:</h3>
                    <ul className="list-disc list-inside space-y-1" style={{color: washuGray}}>
                        <li><span className="font-semibold text-red-500">Empiric Antibiotics:</span> Risk {'>'} 1.18/1000</li>
                        <li><span className="font-semibold text-yellow-500">Enhanced Vital Signs:</span> Risk 0.65-1.18/1000</li>
                        <li><span className="font-semibold text-green-500">Routine Care:</span> Risk {'<'} 0.65/1000</li>
                    </ul>
                </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow-md text-sm" style={{color: washuGray}}>
              <p><span className="font-bold">Disclaimer:</span> This tool is intended for educational purposes and to support clinical decision-making. It is not a substitute for professional medical advice, diagnosis, or treatment. The risk estimates are based on the model published by <a href="https://pubmed.ncbi.nlm.nih.gov/28634205/" target="_blank" rel="noopener noreferrer" style={{color: washuRed}}>Kuzniewicz et al., 2017</a>. Clinical judgment should always be used when making patient care decisions.</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
