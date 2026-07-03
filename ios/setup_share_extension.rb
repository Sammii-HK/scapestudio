#!/usr/bin/env ruby
# One-time script: wires the App Group entitlement onto the main App
# target, creates a new "ScapeShare" Share Extension target, and embeds it
# in the main app. Run once; re-running is idempotent (checks for the
# target before creating it).
require 'xcodeproj'

PROJECT_PATH = 'App/App.xcodeproj'
TEAM_ID = 'JVSPF7L766'
MAIN_BUNDLE_ID = 'uk.scsq.studio'
EXT_BUNDLE_ID = 'uk.scsq.studio.ScapeShare'
DEPLOYMENT_TARGET = '15.0'

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == 'App' }
raise "App target not found" unless app_target

# --- 1. Wire the App Group entitlement + signing onto the main App target ---
app_target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  config.build_settings['DEVELOPMENT_TEAM'] = TEAM_ID
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = MAIN_BUNDLE_ID
end

# --- 2. Create the Share Extension target (idempotent) ---
ext_target = project.targets.find { |t| t.name == 'ScapeShare' }

if ext_target.nil?
  ext_target = project.new_target(:app_extension, 'ScapeShare', :ios, DEPLOYMENT_TARGET)

  ext_target.build_configurations.each do |config|
    config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = EXT_BUNDLE_ID
    config.build_settings['DEVELOPMENT_TEAM'] = TEAM_ID
    config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'ScapeShare/ScapeShare.entitlements'
    config.build_settings['INFOPLIST_FILE'] = 'ScapeShare/Info.plist'
    config.build_settings['SWIFT_VERSION'] = '5.0'
    config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
    config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
    config.build_settings['MARKETING_VERSION'] = '1.0'
    config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  end

  # Group + file references for the extension's own source folder
  group = project.main_group.new_group('ScapeShare', 'ScapeShare')
  ['ShareViewController.swift', 'Info.plist', 'ScapeShare.entitlements', 'MainInterface.storyboard'].each do |fname|
    ref = group.new_reference("ScapeShare/#{fname}")
    if fname.end_with?('.swift')
      ext_target.source_build_phase.add_file_reference(ref)
    end
  end

  # Embed the extension in the main app (Embed App Extensions build phase)
  embed_phase = app_target.copy_files_build_phases.find { |p| p.symbol_dst_subfolder_spec == :plug_ins } ||
    app_target.new_copy_files_build_phase('Embed App Extensions')
  embed_phase.symbol_dst_subfolder_spec = :plug_ins
  embed_phase.name = 'Embed App Extensions'
  product_ref = ext_target.product_reference
  build_file = embed_phase.add_file_reference(product_ref)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeaderOnCopy'] }

  app_target.add_dependency(ext_target)

  puts "Created ScapeShare extension target."
else
  puts "ScapeShare target already exists, skipped creation (re-applied signing settings only)."
  ext_target.build_configurations.each do |config|
    config.build_settings['DEVELOPMENT_TEAM'] = TEAM_ID
    config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  end
end

project.save
puts "Project saved."
