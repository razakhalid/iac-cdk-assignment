const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');

class IacCdkAssignmentStackServer extends cdk.Stack {
    /**
     *
     * @param {Construct} scope
     * @param {string} id
     * @param {StackProps=} props
     */
    constructor(scope, id, props) {
        super(scope, id, props);

        // Use VPC from VPC stack
        const { vpc } = props;

        // Create security group for servers
        const serverSG = new ec2.SecurityGroup(this,
            'ServerSG',
            {
                vpc,
                allowAllOutbound: true
            }
        );
        // Allow HTTP traffic to port 80 from anywhere
        serverSG.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic to port 80 from anywhere');

        // Create security group for database
        const databaseSG = new ec2.SecurityGroup(this,
            'DatabaseSG',
            {
                vpc,
                allowAllOutbound: true
            }
        )
        // Allow servers to access database
        databaseSG.addIngressRule(serverSG, ec2.Port.tcp(3306), 'Allow servers to access database');

        // Create RDS database instance
        new rds.DatabaseInstance(this, 'RDSInstance', {
            engine: rds.DatabaseInstanceEngine.mysql({
                version: rds.MysqlEngineVersion.VER_8_0 // latest version
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
            vpc,
            multiAz: true,
            allocatedStorage: 10,
            securityGroups: [databaseSG],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            databaseName: 'RDSDatabase',
            credentials: rds.Credentials.fromGeneratedSecret('admin')
        });

        // Run servers in public subnets
        const userData = ec2.UserData.forLinux();
        userData.addCommands(`yum install -y httpd`, `systemctl start httpd`, `systemctl enable httpd`);

        vpc.selectSubnets({
            subnetType: ec2.SubnetType.PUBLIC,
        }).subnets.forEach(subnet => {
            new ec2.Instance(this, `Server-${subnet.subnetId}`,
                {
                    vpc,
                    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
                    machineImage: ec2.MachineImage.latestAmazonLinux2(),
                    vpcSubnets: {
                        subnets: [
                            subnet
                        ]
                    },
                    securityGroup: serverSG,
                    userData
                })
        })
    }
}

module.exports = { IacCdkAssignmentStack: IacCdkAssignmentStackServer }
