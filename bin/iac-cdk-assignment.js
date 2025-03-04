#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { IacCdkAssignmentStackVpc } = require('../lib/iac-cdk-assignment-stack-vpc');
const { IacCdkAssignmentStackServer } = require('../lib/iac-cdk-assignment-stack-server');

const app = new cdk.App();
const vpcStack = new IacCdkAssignmentStackVpc(app, 'VPCStack', app, 'VPCStack');

new IacCdkAssignmentStackServer(app, 'ServerStack', {
    vpc: vpcStack.vpc
});