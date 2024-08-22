use hound::{SampleFormat, WavReader, WavSpec, WavWriter};
use log::debug;
use pitch_shift::PitchShifter;
use std::io::Cursor;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn apply_pitch(data: &[u8], semitones: f32) -> Vec<u8> {
    // Read the WAV data
    let mut reader = WavReader::new(Cursor::new(data)).expect("Failed to create WavReader");
    let spec = reader.spec();
    let sample_rate = spec.sample_rate as usize;

    // Convert WAV samples to f32 and collect them
    let samples: Vec<f32> = reader
        .samples::<i16>()
        .map(|s| s.expect("Failed to read sample") as f32 / i16::MAX as f32)
        .collect();

    // Create a pitch shifter
    let window_duration_ms = 50;
    let mut pitch_shifter = PitchShifter::new(window_duration_ms, sample_rate);

    // Prepare output buffer
    let mut output_samples = vec![0.0; samples.len()];

    // Apply pitch shifting
    pitch_shifter.shift_pitch(16, semitones, &samples, &mut output_samples);

    // Debug output
    debug!("Number of output samples: {}", output_samples.len());
    debug!("First few output samples: {:?}", &output_samples[..10]);

    // Prepare to write the output samples back to WAV format
    let mut output_buffer = Cursor::new(Vec::new());
    let mut writer = WavWriter::new(
        &mut output_buffer,
        WavSpec {
            channels: spec.channels,
            sample_rate: sample_rate as u32,
            bits_per_sample: spec.bits_per_sample,
            sample_format: SampleFormat::Int,
        },
    )
    .expect("Failed to create WavWriter");

    // Write the resampled samples back to WAV format
    for sample in output_samples.iter() {
        let scaled_sample =
            (*sample * i16::MAX as f32).clamp(-i16::MAX as f32, i16::MAX as f32) as i16;
        writer
            .write_sample(scaled_sample)
            .expect("Failed to write sample");
    }

    // Finalize the WAV file and get the data
    writer.finalize().expect("Failed to finalize WAV file");
    output_buffer.into_inner()
}

#[wasm_bindgen(start)]
pub fn start() {
    console_log::init_with_level(log::Level::Debug).unwrap();
}

#[wasm_bindgen]
pub fn apply_gain(input_data: &[u8], gain: f32) -> Vec<u8> {
    // Ensure the input is at least long enough to have a valid WAV header (44 bytes)
    if input_data.len() < 44 {
        // Return the original data if it's too short to process
        return input_data.to_vec();
    }

    // Copy the header (first 44 bytes) as is
    let mut output_data = input_data[..44].to_vec();

    // Apply gain to the audio data (assuming it's 16-bit PCM)
    for chunk in input_data[44..].chunks(2) {
        if chunk.len() < 2 {
            // Handle incomplete chunks gracefully
            continue;
        }

        // Convert the 2-byte chunk to a 16-bit sample
        let sample = i16::from_le_bytes([chunk[0], chunk[1]]);

        // Apply gain and clamp the result
        let amplified_sample =
            (sample as f32 * gain).clamp(i16::MIN as f32, i16::MAX as f32) as i16;

        // Append the modified sample to the output data
        output_data.extend_from_slice(&amplified_sample.to_le_bytes());
    }

    output_data
}
