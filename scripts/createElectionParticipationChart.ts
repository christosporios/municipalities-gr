import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
const chartistSvg = require('svg-chartist');

// Read the CSV file
const csvFilePath = path.join(__dirname, '..', '..', 'data', 'elections_all.csv');
const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
const records = parse(csvContent, { columns: true, skip_empty_lines: true });

// Filter for municipalities (Δήμοι) and group by year
const municipalitiesData = records.filter((record: any) => record['ΟΝΟΜΑΣΙΑ ΟΤΑ'].startsWith('Δ.'));
const municipalitiesCount = new Set(municipalitiesData.map((record: any) => record['ΟΝΟΜΑΣΙΑ ΟΤΑ'])).size;
const municipalitiesWith2023Data = new Set(municipalitiesData.filter((record: any) => record['ΕΤΟΣ'] === '2023').map((record: any) => record['ΟΝΟΜΑΣΙΑ ΟΤΑ'])).size;

console.log(`Total number of municipalities: ${municipalitiesCount}`);
console.log(`Number of municipalities with 2023 data: ${municipalitiesWith2023Data}`);


/*
// Calculate average participation rate by year
interface YearData {
    totalRegistered: number;
    totalVoted: number;
}

const participationByYear = municipalitiesData.reduce((acc: Record<number, YearData>, record: any) => {
    const year = parseInt(record['ΕΤΟΣ']);
    const registered = parseInt(record['ΕΓΓΕΓΡΑΜΜΕΝΟΙ (Α)']) || 0;
    const voted = parseInt(record['ΨΗΦΙΣΑΝΤΕΣ (Α)']) || 0;

    if (!acc[year]) {
        acc[year] = { totalRegistered: 0, totalVoted: 0 };
    }

    acc[year].totalRegistered += registered;
    acc[year].totalVoted += voted;

    return acc;
}, {});

const averageParticipationData = Object.entries(participationByYear).map(([year, data]) => ({
    year: parseInt(year),
    participationRate: (data as YearData).totalVoted / (data as YearData).totalRegistered
})).sort((a, b) => a.year - b.year);

averageParticipationData.forEach(({ year, participationRate }) => {
    console.log(year, participationRate)
});

// Prepare data for Chartist
const chartData = {
    labels: averageParticipationData.map(d => d.year.toString()),
    series: [averageParticipationData.map(d => d.participationRate)]
};

// Chart options
const options = {
    width: 960,
    height: 500,
    fullWidth: true,
    chartPadding: {
        right: 40
    },
    axisY: {
        onlyInteger: false,
        labelInterpolationFnc: (value: number) => (value * 100).toFixed(0) + '%'
    }
};

const opts = {
    options: options
};

// Create the output folder if it doesn't exist
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Generate and save the chart
chartistSvg('line', chartData, opts).then((html: string) => {
    fs.writeFileSync(path.join(outputDir, 'election_participation_chart.html'), html);
    console.log('Chart has been generated and saved as election_participation_chart.html');
});*/