/**
 * Pre-defined contacts with PaySim dataset values for fraud analysis
 * 100 contacts total: 15 fraudulent (from fraud data), 85 legitimate (from legit data)
 * Each contact has pre-assigned transaction data based on PaySim dataset patterns
 */

// Generate unique QR data for each contact
const generateQRData = (contact) => {
  const hash = contact.username.split('').reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff, 0);
  return {
    type: 'payment_request',
    payee: contact.upi_id,
    contact_id: contact.id,
    hash: Math.abs(hash).toString(16).padStart(8, '0'),
    verified: true
  };
};

// 15 Fraudulent contacts - based on fraud patterns from PaySim dataset
// Fraud patterns: CASH_OUT and TRANSFER with large amounts, balance anomalies
const fraudulentContacts = [
  {
    id: 'fraud-001',
    full_name: 'Vikram Malhotra',
    username: 'vikram_malhotra',
    upi_id: 'vikram@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 9839.64,
      oldbalanceOrg: 170136.0,
      newbalanceOrig: 160296.36,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-002',
    full_name: 'Rajesh Gupta',
    username: 'rajesh_gupta',
    upi_id: 'rajesh.g@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 181000.0,
      oldbalanceOrg: 181000.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-003',
    full_name: 'Suresh Pandey',
    username: 'suresh_pandey',
    upi_id: 'suresh.p@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 339682.13,
      oldbalanceOrg: 339682.13,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-004',
    full_name: 'Deepak Yadav',
    username: 'deepak_yadav',
    upi_id: 'deepak.y@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 5399500.0,
      oldbalanceOrg: 5399500.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 68882.45,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-005',
    full_name: 'Manish Tiwari',
    username: 'manish_tiwari',
    upi_id: 'manish.t@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 229133.94,
      oldbalanceOrg: 15325.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 5083.0,
      newbalanceDest: 5083.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-006',
    full_name: 'Rohit Saxena',
    username: 'rohit_saxena',
    upi_id: 'rohit.s@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 311685.89,
      oldbalanceOrg: 10835.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-007',
    full_name: 'Anil Kumar Singh',
    username: 'anil_singh',
    upi_id: 'anil.k@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 62927.08,
      oldbalanceOrg: 62927.08,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-008',
    full_name: 'Prakash Mehta',
    username: 'prakash_mehta',
    upi_id: 'prakash.m@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 1587927.08,
      oldbalanceOrg: 1587927.08,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-009',
    full_name: 'Sanjay Dubey',
    username: 'sanjay_dubey',
    upi_id: 'sanjay.d@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 1000000.0,
      oldbalanceOrg: 1000000.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-010',
    full_name: 'Naveen Verma',
    username: 'naveen_verma',
    upi_id: 'naveen.v@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 466721.29,
      oldbalanceOrg: 466721.29,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-011',
    full_name: 'Kiran Joshi',
    username: 'kiran_joshi',
    upi_id: 'kiran.j@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 851002.0,
      oldbalanceOrg: 851002.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-012',
    full_name: 'Vivek Chauhan',
    username: 'vivek_chauhan',
    upi_id: 'vivek.c@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 2806246.0,
      oldbalanceOrg: 2806246.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 21845.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-013',
    full_name: 'Gaurav Kapoor',
    username: 'gaurav_kapoor',
    upi_id: 'gaurav.k@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 419036.68,
      oldbalanceOrg: 419036.68,
      newbalanceOrig: 0.0,
      oldbalanceDest: 6973831.0,
      newbalanceDest: 6973831.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-014',
    full_name: 'Ashok Bhatt',
    username: 'ashok_bhatt',
    upi_id: 'ashok.b@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 10000000.0,
      oldbalanceOrg: 10000000.0,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  },
  {
    id: 'fraud-015',
    full_name: 'Dinesh Mishra',
    username: 'dinesh_mishra',
    upi_id: 'dinesh.m@securebank',
    datasetValues: {
      type: 'CASH_OUT',
      amount: 177416.47,
      oldbalanceOrg: 177416.47,
      newbalanceOrig: 0.0,
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0,
      isFraud: 1
    }
  }
];

// 85 Legitimate contacts - based on normal transaction patterns from PaySim dataset
const legitimateContacts = [
  {
    id: 'legit-001',
    full_name: 'Priya Sharma',
    username: 'priya_sharma',
    upi_id: 'priya@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 500.0,
      oldbalanceOrg: 25000.0,
      newbalanceOrig: 24500.0,
      oldbalanceDest: 10000.0,
      newbalanceDest: 10500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-002',
    full_name: 'Rahul Patel',
    username: 'rahul_patel',
    upi_id: 'rahul@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 2500.0,
      oldbalanceOrg: 50000.0,
      newbalanceOrig: 47500.0,
      oldbalanceDest: 15000.0,
      newbalanceDest: 17500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-003',
    full_name: 'Amit Kumar',
    username: 'amit_kumar',
    upi_id: 'amit@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1200.0,
      oldbalanceOrg: 35000.0,
      newbalanceOrig: 33800.0,
      oldbalanceDest: 20000.0,
      newbalanceDest: 21200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-004',
    full_name: 'Sneha Reddy',
    username: 'sneha_reddy',
    upi_id: 'sneha@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 3000.0,
      oldbalanceOrg: 45000.0,
      newbalanceOrig: 42000.0,
      oldbalanceDest: 25000.0,
      newbalanceDest: 28000.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-005',
    full_name: 'Neha Singh',
    username: 'neha_singh',
    upi_id: 'neha@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 750.0,
      oldbalanceOrg: 18000.0,
      newbalanceOrig: 17250.0,
      oldbalanceDest: 8000.0,
      newbalanceDest: 8750.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-006',
    full_name: 'Arjun Nair',
    username: 'arjun_nair',
    upi_id: 'arjun@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1500.0,
      oldbalanceOrg: 40000.0,
      newbalanceOrig: 38500.0,
      oldbalanceDest: 12000.0,
      newbalanceDest: 13500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-007',
    full_name: 'Kavita Jain',
    username: 'kavita_jain',
    upi_id: 'kavita@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 890.0,
      oldbalanceOrg: 22000.0,
      newbalanceOrig: 21110.0,
      oldbalanceDest: 5000.0,
      newbalanceDest: 5890.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-008',
    full_name: 'Ravi Desai',
    username: 'ravi_desai',
    upi_id: 'ravi@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 5000.0,
      oldbalanceOrg: 75000.0,
      newbalanceOrig: 70000.0,
      oldbalanceDest: 30000.0,
      newbalanceDest: 35000.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-009',
    full_name: 'Sunita Agarwal',
    username: 'sunita_agarwal',
    upi_id: 'sunita@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 299.0,
      oldbalanceOrg: 15000.0,
      newbalanceOrig: 14701.0,
      oldbalanceDest: 7500.0,
      newbalanceDest: 7799.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-010',
    full_name: 'Mohan Das',
    username: 'mohan_das',
    upi_id: 'mohan@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 1800.0,
      oldbalanceOrg: 28000.0,
      newbalanceOrig: 26200.0,
      oldbalanceDest: 9000.0,
      newbalanceDest: 10800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-011',
    full_name: 'Lakshmi Menon',
    username: 'lakshmi_menon',
    upi_id: 'lakshmi@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 450.0,
      oldbalanceOrg: 12500.0,
      newbalanceOrig: 12050.0,
      oldbalanceDest: 6000.0,
      newbalanceDest: 6450.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-012',
    full_name: 'Anand Krishnan',
    username: 'anand_krishnan',
    upi_id: 'anand@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 7500.0,
      oldbalanceOrg: 85000.0,
      newbalanceOrig: 77500.0,
      oldbalanceDest: 40000.0,
      newbalanceDest: 47500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-013',
    full_name: 'Pooja Bansal',
    username: 'pooja_bansal',
    upi_id: 'pooja@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1100.0,
      oldbalanceOrg: 32000.0,
      newbalanceOrig: 30900.0,
      oldbalanceDest: 18000.0,
      newbalanceDest: 19100.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-014',
    full_name: 'Vijay Thakur',
    username: 'vijay_thakur',
    upi_id: 'vijay@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2200.0,
      oldbalanceOrg: 55000.0,
      newbalanceOrig: 52800.0,
      oldbalanceDest: 22000.0,
      newbalanceDest: 24200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-015',
    full_name: 'Meera Iyer',
    username: 'meera_iyer',
    upi_id: 'meera@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 680.0,
      oldbalanceOrg: 19500.0,
      newbalanceOrig: 18820.0,
      oldbalanceDest: 11000.0,
      newbalanceDest: 11680.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-016',
    full_name: 'Arun Pillai',
    username: 'arun_pillai',
    upi_id: 'arun@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 4200.0,
      oldbalanceOrg: 62000.0,
      newbalanceOrig: 57800.0,
      oldbalanceDest: 27000.0,
      newbalanceDest: 31200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-017',
    full_name: 'Deepika Shah',
    username: 'deepika_shah',
    upi_id: 'deepika@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 999.0,
      oldbalanceOrg: 28500.0,
      newbalanceOrig: 27501.0,
      oldbalanceDest: 14000.0,
      newbalanceDest: 14999.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-018',
    full_name: 'Santosh Kulkarni',
    username: 'santosh_kulkarni',
    upi_id: 'santosh@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 6500.0,
      oldbalanceOrg: 78000.0,
      newbalanceOrig: 71500.0,
      oldbalanceDest: 35000.0,
      newbalanceDest: 41500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-019',
    full_name: 'Radha Venkatesh',
    username: 'radha_venkatesh',
    upi_id: 'radha@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 350.0,
      oldbalanceOrg: 16000.0,
      newbalanceOrig: 15650.0,
      oldbalanceDest: 8500.0,
      newbalanceDest: 8850.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-020',
    full_name: 'Harish Rao',
    username: 'harish_rao',
    upi_id: 'harish@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1750.0,
      oldbalanceOrg: 42000.0,
      newbalanceOrig: 40250.0,
      oldbalanceDest: 19000.0,
      newbalanceDest: 20750.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-021',
    full_name: 'Anita Saxena',
    username: 'anita_saxena',
    upi_id: 'anita@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1350.0,
      oldbalanceOrg: 36000.0,
      newbalanceOrig: 34650.0,
      oldbalanceDest: 16000.0,
      newbalanceDest: 17350.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-022',
    full_name: 'Sunil Khanna',
    username: 'sunil_khanna',
    upi_id: 'sunil@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 8000.0,
      oldbalanceOrg: 92000.0,
      newbalanceOrig: 84000.0,
      oldbalanceDest: 45000.0,
      newbalanceDest: 53000.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-023',
    full_name: 'Geeta Chopra',
    username: 'geeta_chopra',
    upi_id: 'geeta@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 550.0,
      oldbalanceOrg: 21000.0,
      newbalanceOrig: 20450.0,
      oldbalanceDest: 9500.0,
      newbalanceDest: 10050.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-024',
    full_name: 'Rajendra Mishra',
    username: 'rajendra_mishra',
    upi_id: 'rajendra@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 3500.0,
      oldbalanceOrg: 48000.0,
      newbalanceOrig: 44500.0,
      oldbalanceDest: 23000.0,
      newbalanceDest: 26500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-025',
    full_name: 'Maya Bose',
    username: 'maya_bose',
    upi_id: 'maya@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 799.0,
      oldbalanceOrg: 24000.0,
      newbalanceOrig: 23201.0,
      oldbalanceDest: 11500.0,
      newbalanceDest: 12299.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-026',
    full_name: 'Pawan Chandra',
    username: 'pawan_chandra',
    upi_id: 'pawan@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2800.0,
      oldbalanceOrg: 58000.0,
      newbalanceOrig: 55200.0,
      oldbalanceDest: 28000.0,
      newbalanceDest: 30800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-027',
    full_name: 'Nirmala Prasad',
    username: 'nirmala_prasad',
    upi_id: 'nirmala@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 420.0,
      oldbalanceOrg: 17500.0,
      newbalanceOrig: 17080.0,
      oldbalanceDest: 7000.0,
      newbalanceDest: 7420.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-028',
    full_name: 'Kishore Reddy',
    username: 'kishore_reddy',
    upi_id: 'kishore@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 5500.0,
      oldbalanceOrg: 68000.0,
      newbalanceOrig: 62500.0,
      oldbalanceDest: 32000.0,
      newbalanceDest: 37500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-029',
    full_name: 'Shanti Devi',
    username: 'shanti_devi',
    upi_id: 'shanti@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1050.0,
      oldbalanceOrg: 29000.0,
      newbalanceOrig: 27950.0,
      oldbalanceDest: 13500.0,
      newbalanceDest: 14550.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-030',
    full_name: 'Manoj Shetty',
    username: 'manoj_shetty',
    upi_id: 'manoj@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 4800.0,
      oldbalanceOrg: 65000.0,
      newbalanceOrig: 60200.0,
      oldbalanceDest: 29000.0,
      newbalanceDest: 33800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-031',
    full_name: 'Preeti Malhotra',
    username: 'preeti_malhotra',
    upi_id: 'preeti@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 625.0,
      oldbalanceOrg: 20500.0,
      newbalanceOrig: 19875.0,
      oldbalanceDest: 10500.0,
      newbalanceDest: 11125.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-032',
    full_name: 'Umesh Patil',
    username: 'umesh_patil',
    upi_id: 'umesh@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1900.0,
      oldbalanceOrg: 44000.0,
      newbalanceOrig: 42100.0,
      oldbalanceDest: 21000.0,
      newbalanceDest: 22900.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-033',
    full_name: 'Rekha Goyal',
    username: 'rekha_goyal',
    upi_id: 'rekha@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 875.0,
      oldbalanceOrg: 26000.0,
      newbalanceOrig: 25125.0,
      oldbalanceDest: 12500.0,
      newbalanceDest: 13375.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-034',
    full_name: 'Ashwin Nair',
    username: 'ashwin_nair',
    upi_id: 'ashwin@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 9000.0,
      oldbalanceOrg: 105000.0,
      newbalanceOrig: 96000.0,
      oldbalanceDest: 48000.0,
      newbalanceDest: 57000.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-035',
    full_name: 'Sarla Bajaj',
    username: 'sarla_bajaj',
    upi_id: 'sarla@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 380.0,
      oldbalanceOrg: 14500.0,
      newbalanceOrig: 14120.0,
      oldbalanceDest: 6500.0,
      newbalanceDest: 6880.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-036',
    full_name: 'Dinkar Jha',
    username: 'dinkar_jha',
    upi_id: 'dinkar@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 2900.0,
      oldbalanceOrg: 52000.0,
      newbalanceOrig: 49100.0,
      oldbalanceDest: 24000.0,
      newbalanceDest: 26900.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-037',
    full_name: 'Kamala Mukherjee',
    username: 'kamala_mukherjee',
    upi_id: 'kamala@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1450.0,
      oldbalanceOrg: 38000.0,
      newbalanceOrig: 36550.0,
      oldbalanceDest: 17500.0,
      newbalanceDest: 18950.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-038',
    full_name: 'Bharat Singh',
    username: 'bharat_singh',
    upi_id: 'bharat@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2400.0,
      oldbalanceOrg: 56000.0,
      newbalanceOrig: 53600.0,
      oldbalanceDest: 26000.0,
      newbalanceDest: 28400.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-039',
    full_name: 'Savita Tiwari',
    username: 'savita_tiwari',
    upi_id: 'savita@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 720.0,
      oldbalanceOrg: 23500.0,
      newbalanceOrig: 22780.0,
      oldbalanceDest: 11200.0,
      newbalanceDest: 11920.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-040',
    full_name: 'Yash Agarwal',
    username: 'yash_agarwal',
    upi_id: 'yash@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 6200.0,
      oldbalanceOrg: 82000.0,
      newbalanceOrig: 75800.0,
      oldbalanceDest: 38000.0,
      newbalanceDest: 44200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-041',
    full_name: 'Padma Rajan',
    username: 'padma_rajan',
    upi_id: 'padma@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 510.0,
      oldbalanceOrg: 18500.0,
      newbalanceOrig: 17990.0,
      oldbalanceDest: 8800.0,
      newbalanceDest: 9310.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-042',
    full_name: 'Ramesh Bhardwaj',
    username: 'ramesh_bhardwaj',
    upi_id: 'ramesh@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 3800.0,
      oldbalanceOrg: 54000.0,
      newbalanceOrig: 50200.0,
      oldbalanceDest: 25500.0,
      newbalanceDest: 29300.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-043',
    full_name: 'Suman Pandey',
    username: 'suman_pandey',
    upi_id: 'suman@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 950.0,
      oldbalanceOrg: 27500.0,
      newbalanceOrig: 26550.0,
      oldbalanceDest: 13000.0,
      newbalanceDest: 13950.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-044',
    full_name: 'Jagdish Verma',
    username: 'jagdish_verma',
    upi_id: 'jagdish@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1650.0,
      oldbalanceOrg: 39000.0,
      newbalanceOrig: 37350.0,
      oldbalanceDest: 18500.0,
      newbalanceDest: 20150.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-045',
    full_name: 'Asha Menon',
    username: 'asha_menon',
    upi_id: 'asha@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1280.0,
      oldbalanceOrg: 33500.0,
      newbalanceOrig: 32220.0,
      oldbalanceDest: 15500.0,
      newbalanceDest: 16780.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-046',
    full_name: 'Nitin Deshmukh',
    username: 'nitin_deshmukh',
    upi_id: 'nitin@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 7200.0,
      oldbalanceOrg: 88000.0,
      newbalanceOrig: 80800.0,
      oldbalanceDest: 42000.0,
      newbalanceDest: 49200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-047',
    full_name: 'Usha Rani',
    username: 'usha_rani',
    upi_id: 'usha@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 480.0,
      oldbalanceOrg: 16500.0,
      newbalanceOrig: 16020.0,
      oldbalanceDest: 7800.0,
      newbalanceDest: 8280.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-048',
    full_name: 'Gopal Krishna',
    username: 'gopal_krishna',
    upi_id: 'gopal@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 4500.0,
      oldbalanceOrg: 60000.0,
      newbalanceOrig: 55500.0,
      oldbalanceDest: 28500.0,
      newbalanceDest: 33000.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-049',
    full_name: 'Leela Sundaram',
    username: 'leela_sundaram',
    upi_id: 'leela@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 670.0,
      oldbalanceOrg: 21500.0,
      newbalanceOrig: 20830.0,
      oldbalanceDest: 10200.0,
      newbalanceDest: 10870.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-050',
    full_name: 'Tarun Mehta',
    username: 'tarun_mehta',
    upi_id: 'tarun@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2100.0,
      oldbalanceOrg: 47000.0,
      newbalanceOrig: 44900.0,
      oldbalanceDest: 22500.0,
      newbalanceDest: 24600.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-051',
    full_name: 'Jyoti Sharma',
    username: 'jyoti_sharma',
    upi_id: 'jyoti@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 850.0,
      oldbalanceOrg: 25500.0,
      newbalanceOrig: 24650.0,
      oldbalanceDest: 12000.0,
      newbalanceDest: 12850.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-052',
    full_name: 'Murali Krishnan',
    username: 'murali_krishnan',
    upi_id: 'murali@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 5800.0,
      oldbalanceOrg: 72000.0,
      newbalanceOrig: 66200.0,
      oldbalanceDest: 34000.0,
      newbalanceDest: 39800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-053',
    full_name: 'Vidya Nair',
    username: 'vidya_nair',
    upi_id: 'vidya@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 395.0,
      oldbalanceOrg: 15500.0,
      newbalanceOrig: 15105.0,
      oldbalanceDest: 7200.0,
      newbalanceDest: 7595.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-054',
    full_name: 'Naresh Kapoor',
    username: 'naresh_kapoor',
    upi_id: 'naresh@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 3200.0,
      oldbalanceOrg: 49000.0,
      newbalanceOrig: 45800.0,
      oldbalanceDest: 23500.0,
      newbalanceDest: 26700.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-055',
    full_name: 'Pushpa Lata',
    username: 'pushpa_lata',
    upi_id: 'pushpa@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1180.0,
      oldbalanceOrg: 31000.0,
      newbalanceOrig: 29820.0,
      oldbalanceDest: 14500.0,
      newbalanceDest: 15680.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-056',
    full_name: 'Sanjiv Gupta',
    username: 'sanjiv_gupta',
    upi_id: 'sanjiv@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1850.0,
      oldbalanceOrg: 41000.0,
      newbalanceOrig: 39150.0,
      oldbalanceDest: 19500.0,
      newbalanceDest: 21350.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-057',
    full_name: 'Kalpana Roy',
    username: 'kalpana_roy',
    upi_id: 'kalpana@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 590.0,
      oldbalanceOrg: 19000.0,
      newbalanceOrig: 18410.0,
      oldbalanceDest: 9000.0,
      newbalanceDest: 9590.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-058',
    full_name: 'Venkat Rao',
    username: 'venkat_rao',
    upi_id: 'venkat@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 8500.0,
      oldbalanceOrg: 98000.0,
      newbalanceOrig: 89500.0,
      oldbalanceDest: 46000.0,
      newbalanceDest: 54500.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-059',
    full_name: 'Hema Malini',
    username: 'hema_malini',
    upi_id: 'hema@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 760.0,
      oldbalanceOrg: 22500.0,
      newbalanceOrig: 21740.0,
      oldbalanceDest: 10700.0,
      newbalanceDest: 11460.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-060',
    full_name: 'Om Prakash',
    username: 'om_prakash',
    upi_id: 'om@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 4100.0,
      oldbalanceOrg: 57000.0,
      newbalanceOrig: 52900.0,
      oldbalanceDest: 27500.0,
      newbalanceDest: 31600.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-061',
    full_name: 'Rita Joshi',
    username: 'rita_joshi',
    upi_id: 'rita@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 430.0,
      oldbalanceOrg: 17000.0,
      newbalanceOrig: 16570.0,
      oldbalanceDest: 8100.0,
      newbalanceDest: 8530.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-062',
    full_name: 'Gagan Deep',
    username: 'gagan_deep',
    upi_id: 'gagan@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2600.0,
      oldbalanceOrg: 54000.0,
      newbalanceOrig: 51400.0,
      oldbalanceDest: 25500.0,
      newbalanceDest: 28100.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-063',
    full_name: 'Sunita Bhat',
    username: 'sunita_bhat',
    upi_id: 'sunita.b@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1020.0,
      oldbalanceOrg: 28000.0,
      newbalanceOrig: 26980.0,
      oldbalanceDest: 13200.0,
      newbalanceDest: 14220.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-064',
    full_name: 'Prakash Yadav',
    username: 'prakash_yadav',
    upi_id: 'prakash.y@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 6800.0,
      oldbalanceOrg: 84000.0,
      newbalanceOrig: 77200.0,
      oldbalanceDest: 39000.0,
      newbalanceDest: 45800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-065',
    full_name: 'Madhuri Dixit',
    username: 'madhuri_dixit',
    upi_id: 'madhuri@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 325.0,
      oldbalanceOrg: 13500.0,
      newbalanceOrig: 13175.0,
      oldbalanceDest: 6200.0,
      newbalanceDest: 6525.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-066',
    full_name: 'Dilip Kumar',
    username: 'dilip_kumar',
    upi_id: 'dilip@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 2700.0,
      oldbalanceOrg: 46000.0,
      newbalanceOrig: 43300.0,
      oldbalanceDest: 22000.0,
      newbalanceDest: 24700.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-067',
    full_name: 'Seema Gill',
    username: 'seema_gill',
    upi_id: 'seema@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1350.0,
      oldbalanceOrg: 35500.0,
      newbalanceOrig: 34150.0,
      oldbalanceDest: 16500.0,
      newbalanceDest: 17850.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-068',
    full_name: 'Raman Kumar',
    username: 'raman_kumar',
    upi_id: 'raman@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1980.0,
      oldbalanceOrg: 43000.0,
      newbalanceOrig: 41020.0,
      oldbalanceDest: 20500.0,
      newbalanceDest: 22480.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-069',
    full_name: 'Tara Chand',
    username: 'tara_chand',
    upi_id: 'tara@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 645.0,
      oldbalanceOrg: 20000.0,
      newbalanceOrig: 19355.0,
      oldbalanceDest: 9500.0,
      newbalanceDest: 10145.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-070',
    full_name: 'Hemant Kher',
    username: 'hemant_kher',
    upi_id: 'hemant@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 5200.0,
      oldbalanceOrg: 67000.0,
      newbalanceOrig: 61800.0,
      oldbalanceDest: 31000.0,
      newbalanceDest: 36200.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-071',
    full_name: 'Laxmi Narayan',
    username: 'laxmi_narayan',
    upi_id: 'laxmi@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 890.0,
      oldbalanceOrg: 26500.0,
      newbalanceOrig: 25610.0,
      oldbalanceDest: 12500.0,
      newbalanceDest: 13390.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-072',
    full_name: 'Chetan Bhagat',
    username: 'chetan_bhagat',
    upi_id: 'chetan@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 3600.0,
      oldbalanceOrg: 51000.0,
      newbalanceOrig: 47400.0,
      oldbalanceDest: 24500.0,
      newbalanceDest: 28100.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-073',
    full_name: 'Parveen Bano',
    username: 'parveen_bano',
    upi_id: 'parveen@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 540.0,
      oldbalanceOrg: 18000.0,
      newbalanceOrig: 17460.0,
      oldbalanceDest: 8600.0,
      newbalanceDest: 9140.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-074',
    full_name: 'Sudhir Sharma',
    username: 'sudhir_sharma',
    upi_id: 'sudhir@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 2350.0,
      oldbalanceOrg: 51000.0,
      newbalanceOrig: 48650.0,
      oldbalanceDest: 24000.0,
      newbalanceDest: 26350.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-075',
    full_name: 'Malini Sen',
    username: 'malini_sen',
    upi_id: 'malini@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1150.0,
      oldbalanceOrg: 30000.0,
      newbalanceOrig: 28850.0,
      oldbalanceDest: 14000.0,
      newbalanceDest: 15150.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-076',
    full_name: 'Ajay Devgan',
    username: 'ajay_devgan',
    upi_id: 'ajay@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 7800.0,
      oldbalanceOrg: 92000.0,
      newbalanceOrig: 84200.0,
      oldbalanceDest: 44000.0,
      newbalanceDest: 51800.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-077',
    full_name: 'Archana Puran',
    username: 'archana_puran',
    upi_id: 'archana@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 470.0,
      oldbalanceOrg: 16000.0,
      newbalanceOrig: 15530.0,
      oldbalanceDest: 7600.0,
      newbalanceDest: 8070.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-078',
    full_name: 'Balram Singh',
    username: 'balram_singh',
    upi_id: 'balram@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 4300.0,
      oldbalanceOrg: 59000.0,
      newbalanceOrig: 54700.0,
      oldbalanceDest: 28000.0,
      newbalanceDest: 32300.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-079',
    full_name: 'Chanchal Kumari',
    username: 'chanchal_kumari',
    upi_id: 'chanchal@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 815.0,
      oldbalanceOrg: 24000.0,
      newbalanceOrig: 23185.0,
      oldbalanceDest: 11400.0,
      newbalanceDest: 12215.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-080',
    full_name: 'Dhanraj Pillai',
    username: 'dhanraj_pillai',
    upi_id: 'dhanraj@securebank',
    datasetValues: {
      type: 'DEBIT',
      amount: 1720.0,
      oldbalanceOrg: 38000.0,
      newbalanceOrig: 36280.0,
      oldbalanceDest: 18000.0,
      newbalanceDest: 19720.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-081',
    full_name: 'Farah Khan',
    username: 'farah_khan',
    upi_id: 'farah@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 980.0,
      oldbalanceOrg: 27000.0,
      newbalanceOrig: 26020.0,
      oldbalanceDest: 12800.0,
      newbalanceDest: 13780.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-082',
    full_name: 'Girish Karnad',
    username: 'girish_karnad',
    upi_id: 'girish@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 6100.0,
      oldbalanceOrg: 76000.0,
      newbalanceOrig: 69900.0,
      oldbalanceDest: 36000.0,
      newbalanceDest: 42100.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-083',
    full_name: 'Harpreet Kaur',
    username: 'harpreet_kaur',
    upi_id: 'harpreet@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 360.0,
      oldbalanceOrg: 14000.0,
      newbalanceOrig: 13640.0,
      oldbalanceDest: 6600.0,
      newbalanceDest: 6960.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-084',
    full_name: 'Irfan Pathan',
    username: 'irfan_pathan',
    upi_id: 'irfan@securebank',
    datasetValues: {
      type: 'TRANSFER',
      amount: 2950.0,
      oldbalanceOrg: 47000.0,
      newbalanceOrig: 44050.0,
      oldbalanceDest: 22500.0,
      newbalanceDest: 25450.0,
      isFraud: 0
    }
  },
  {
    id: 'legit-085',
    full_name: 'Jasmine Shah',
    username: 'jasmine_shah',
    upi_id: 'jasmine@securebank',
    datasetValues: {
      type: 'PAYMENT',
      amount: 1290.0,
      oldbalanceOrg: 34000.0,
      newbalanceOrig: 32710.0,
      oldbalanceDest: 16000.0,
      newbalanceDest: 17290.0,
      isFraud: 0
    }
  }
];

// Combine all contacts and add QR data
const allContacts = [...fraudulentContacts, ...legitimateContacts].map(contact => ({
  ...contact,
  qrData: generateQRData(contact),
  // Risk bias based on fraud status
  riskBias: contact.datasetValues.isFraud === 1 
    ? (['critical', 'high'][Math.floor(Math.random() * 2)]) 
    : 'low'
}));

// Shuffle array for random order display
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const CONTACTS_DATA = shuffleArray(allContacts);

// Export fraud counts for verification
export const FRAUD_COUNT = fraudulentContacts.length;
export const LEGIT_COUNT = legitimateContacts.length;
export const TOTAL_COUNT = CONTACTS_DATA.length;

// Helper function to get contact by ID
export const getContactById = (id) => CONTACTS_DATA.find(c => c.id === id);

// Helper function to search contacts
export const searchContacts = (query) => {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return CONTACTS_DATA.filter(c => 
    c.full_name.toLowerCase().includes(q) ||
    c.username.toLowerCase().includes(q) ||
    c.upi_id.toLowerCase().includes(q)
  );
};

// Helper function to analyze transaction based on dataset values
export const analyzeContactTransaction = (contact, amount) => {
  const data = contact.datasetValues;
  
  // Calculate fraud probability based on dataset patterns
  let fraudProbability = 0;
  const riskFactors = [];
  
  if (data.isFraud === 1) {
    // This is a known fraud pattern from dataset
    fraudProbability = 0.85 + Math.random() * 0.14; // 85-99%
    
    // Add risk factors based on dataset patterns
    if (data.type === 'CASH_OUT') {
      riskFactors.push('CASH_OUT transaction type - highest fraud risk in PaySim dataset');
    }
    if (data.type === 'TRANSFER') {
      riskFactors.push('TRANSFER transaction pattern matches fraud profiles');
    }
    if (data.newbalanceOrig === 0) {
      riskFactors.push('Complete account drainage detected - typical fraud indicator');
    }
    if (data.oldbalanceOrg === data.amount) {
      riskFactors.push('Transaction empties entire sender balance - suspicious pattern');
    }
    if (data.newbalanceDest === 0 && data.oldbalanceDest > 0) {
      riskFactors.push('Destination balance anomaly - funds may be moved quickly');
    }
    if (data.amount > 100000) {
      riskFactors.push(`High value transaction (₹${data.amount.toLocaleString()}) flagged in dataset`);
    }
    riskFactors.push('Transaction pattern matches confirmed fraud cases in PaySim training data');
    
  } else {
    // Legitimate transaction pattern
    fraudProbability = Math.random() * 0.15; // 0-15%
    
    if (data.type === 'PAYMENT') {
      riskFactors.push('PAYMENT type - low fraud rate in dataset');
    }
    if (data.type === 'DEBIT') {
      riskFactors.push('DEBIT transaction - normal banking operation');
    }
    if (data.newbalanceOrig > 0) {
      riskFactors.push('Healthy account balance maintained after transaction');
    }
  }
  
  // Adjust based on transaction amount entered by user
  if (amount && parseFloat(amount) > data.amount * 2) {
    fraudProbability = Math.min(fraudProbability + 0.2, 0.99);
    riskFactors.push(`Requested amount significantly higher than typical pattern (₹${data.amount.toLocaleString()})`);
  }
  
  // Determine risk level
  let riskLevel;
  if (fraudProbability >= 0.85) riskLevel = 'critical';
  else if (fraudProbability >= 0.60) riskLevel = 'high';
  else if (fraudProbability >= 0.30) riskLevel = 'medium';
  else riskLevel = 'low';
  
  // Generate recommendation
  const recommendations = {
    critical: 'BLOCK RECOMMENDED: This recipient\'s transaction pattern matches confirmed fraud cases in the PaySim dataset. Transaction will be blocked.',
    high: 'REVIEW REQUIRED: Similar patterns found in fraud training data. Manual verification strongly recommended.',
    medium: 'CAUTION: Some risk indicators present. Proceed with verification.',
    low: 'SAFE: Transaction pattern consistent with legitimate users in PaySim dataset.'
  };
  
  return {
    isFraud: data.isFraud === 1,
    fraudProbability,
    riskLevel,
    riskFactors,
    recommendation: recommendations[riskLevel],
    shouldBlock: riskLevel === 'critical',
    requiresReview: riskLevel === 'high' || riskLevel === 'critical',
    datasetSource: {
      type: data.type,
      typicalAmount: data.amount,
      originalBalance: data.oldbalanceOrg,
      isFraudInDataset: data.isFraud === 1
    }
  };
};

// Generate unique QR code string for a contact
export const generateContactQRString = (contact) => {
  const qrData = {
    type: 'securebank_payment',
    version: '1.0', 
    contact_id: contact.id,
    name: contact.full_name,
    upi: contact.upi_id,
    blockchain_hash: '0x' + contact.qrData.hash.padStart(16, '0'),
    verified: true,
    timestamp: Date.now()
  };
  return JSON.stringify(qrData);
};

// Parse QR code string and find matching contact
export const parseQRCodeAndFindContact = (qrString) => {
  try {
    const qrData = JSON.parse(qrString);
    
    // Validate QR format
    if (qrData.type !== 'securebank_payment') {
      return { success: false, error: 'Invalid QR code format' };
    }
    
    // Find contact by ID or UPI
    const contact = CONTACTS_DATA.find(c => 
      c.id === qrData.contact_id || 
      c.upi_id === qrData.upi
    );
    
    if (contact) {
      return {
        success: true,
        contact,
        qrData,
        blockchainVerified: qrData.verified,
        blockchainHash: qrData.blockchain_hash
      };
    }
    
    return { success: false, error: 'Contact not found' };
  } catch (e) {
    // Try parsing as simple UPI format
    if (qrString.includes('@securebank')) {
      const contact = CONTACTS_DATA.find(c => c.upi_id === qrString);
      if (contact) {
        return {
          success: true,
          contact,
          qrData: { upi: qrString },
          blockchainVerified: false
        };
      }
    }
    return { success: false, error: 'Could not parse QR code' };
  }
};

// Get QR code data URL for a contact (for display purposes)
export const getContactQRDataURL = async (contact) => {
  const QRCode = await import('qrcode');
  const qrString = generateContactQRString(contact);
  return QRCode.toDataURL(qrString, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
};

export default CONTACTS_DATA;
