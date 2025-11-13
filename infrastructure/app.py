#!/usr/bin/env python3
import aws_cdk as cdk
from voice_to_sap_stack import VoiceToSapStack

app = cdk.App()
VoiceToSapStack(app, "VoiceToSapStack")

app.synth()
