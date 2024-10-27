import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const BASE_URL = 'https://wwwapp.eetaa.gr/ekloges/dhmekl2csv.php';
const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'elections');
const COMBINED_FILE = path.join(__dirname, '..', '..', 'data', 'elections_all.csv');
const REQUEST_DELAY = 500;
const REDOWNLOAD = false;

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCSV(id: number): Promise<string> {
    const url = `${BASE_URL}?id=${id}`;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                console.log(`Received 403 for ID ${id}. Retrying in ${5 * (retries + 1)} seconds...`);
                await delay(1000 * 5 * (retries + 1));
                retries++;
            } else {
                throw error;
            }
        }
    }

    throw new Error(`Failed to fetch CSV for ID ${id} after ${maxRetries} retries`);
}

function isEmptyCSV(csvContent: string): boolean {
    const records = parse(csvContent, { delimiter: ';', skip_empty_lines: true });
    return records.length <= 1; // Only header row or less
}

async function saveCSV(id: number, content: string): Promise<void> {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, `election_data_${id}.csv`);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    console.log(`Saved data for ID ${id}`);
}

async function combineCSVs(): Promise<void> {
    const files = await fs.promises.readdir(DATA_DIR);
    const csvFiles = files.filter(file => file.endsWith('.csv'));

    let allData: any[] = [];
    let headers: string[] = [];

    for (const file of csvFiles) {
        const filePath = path.join(DATA_DIR, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const records = parse(content, { delimiter: ';', columns: true });

        if (headers.length === 0) {
            headers = Object.keys(records[0]);
        }

        const id = parseInt(file.match(/election_data_(\d+)\.csv/)?.[1] || '0');
        allData.push(...records.map((record: any) => ({ id, ...record })));
    }

    const combinedContent = stringify(allData, { header: true, columns: ['id', ...headers] });
    await fs.promises.writeFile(COMBINED_FILE, combinedContent, 'utf-8');
    console.log('Combined CSV created successfully.');
}

async function main() {
    let id = 1;
    let emptyCount = 0;
    const MAX_EMPTY = 20; // Stop after MAX_EMPTY consecutive empty responses

    while (emptyCount < MAX_EMPTY) {
        try {
            const filePath = path.join(DATA_DIR, `election_data_${id}.csv`);

            if (!REDOWNLOAD && fs.existsSync(filePath)) {
                console.log(`Skipping ID ${id}, file already exists`);
                emptyCount = 0;
                id++;
                continue;
            }

            const csvContent = await fetchCSV(id);

            if (isEmptyCSV(csvContent)) {
                emptyCount++;
                console.log(`Empty CSV for ID ${id}. Empty count: ${emptyCount}`);
                if (emptyCount === MAX_EMPTY) {
                    console.log(`Reached ${MAX_EMPTY} consecutive empty responses. Stopping.`);
                    break;
                }
            } else {
                emptyCount = 0; // Reset empty count
                await saveCSV(id, csvContent);
            }

            id++;
            await delay(REQUEST_DELAY);
        } catch (error) {
            console.error(`Error fetching data for ID ${id}:`, error);
            break;
        }
    }

    console.log('Scraping completed.');
    await combineCSVs();
}

main().catch(console.error);
