---
toc: false
layout: post
description: Chad Smith's video course
categories: ['AWS', 'Revision']
title: SAA-C02 AWS solutions architect notes
image: http://i.imgur.com/AlR4Rmk.png
---
<style>
table {font-size:100%; white-space:inherit}
table td {max-width:inherit}
</style>

I had my exam booked for 19/03 and then Covid hit. I actually turned up to the venue in Crawley only to be greeted by a hastily written note taped on the door telling me all exams are cancelled.

Having not had an email, and having studied fairly hard for many months we can say I wasn't overjoyed.

It's all good now, I've rescheduled for the remote exam and have restarted my revision.

Here is the course outline for Chad Smith's live lessons course from O'Reilly [^1].

| Module                           | Lesson                                     | Section                                         |
|----------------------------------|--------------------------------------------|-------------------------------------------------|
| 1. Overview                      | 1 Exam Strategies                          | 1. Logistics                                    |
|                                  |                                            | 2. Exam Guide                                   |
|                                  |                                            | 3.Well-Architected Framework                    |
|                                  |                                            | 4. Exam Question Domains                        |
| 2. Resilient Architectures       | 2. Multi-Tier                              | 1. Resilient VPC Architectures                  |
|                                  |                                            | 2. Resilient Application Architectures          |
|                                  |                                            | 3. Resilient Serverless Architectures           |
|                                  |                                            | 4. Question Breakdown                           |
|                                  | 3. Highly Available                        | 1. Definitions                                  |
|                                  |                                            | 2. AWS Global Infrastructure                    |
|                                  |                                            | 3. Questions Breakdown                          |
|                                  | 4. Design Decoupling Mechanisms            | 1. Decoupling with ELB                          |
|                                  |                                            | 2. Decoupling with AWS Lambda and S3            |
|                                  |                                            | 3. Decoupling with SNS, SQS, Auto Scaling       |
|                                  |                                            | 4. Question Breakdown                           |
|                                  | 5. Appropriate Resilient Storage           | 1. EBS Resilience                               |
|                                  |                                            | 2. EFS Resilience                               |
|                                  |                                            | 3. S3 Resilience                                |
|                                  |                                            | 4. Question Breakdown                           |
| 3. High-Performing Architectures | 6. Identify Elastic/Scalable compute       | 1. Elasticity with Unitfied Auto Scaling        |
|                                  |                                            | 2. Elasticity with Managed services             |
|                                  |                                            | 3. Question Breakdown                           |
|                                  | 7. Select high-performing/scalable storage | 1. Block-based storage perf                     |
|                                  |                                            | 2. File-based storage perf                      |
|                                  |                                            | 3. Object-based storage perf                    |
|                                  |                                            | 4. Caching perf - Cloudfront                    |
|                                  |                                            | 5. Caching perf - Elasticache                   |
|                                  |                                            | 6. Question Breakdown                           |
|                                  | 8. Select high-performance Networking      | 1. VPC perf                                     |
|                                  |                                            | 2. Single-node perf                             |
|                                  |                                            | 3. Hybrid network perf                          |
|                                  |                                            | 4. Question Breakdown                           |
|                                  | 9. Select high-perf database solutions     | 1. RDS perf                                     |
|                                  |                                            | 2. DynamoDB perf                                |
|                                  |                                            | 3. Question Breakdown                           |
| 4. Secure Apps and Architectures | 10. Secure access to AWS resources         | 1. Account-based access control                 |
|                                  |                                            | 2. User-based access                            |
|                                  |                                            | 3.Resource-based access                         |
|                                  |                                            | 4. Question Breakdown                           |
|                                  | 11.Design secure app tiers                 | 1. Design secure VPC internal net               |
|                                  |                                            | 2. Design secure VPC egress                     |
|                                  |                                            | 3.Securing app access                           |
|                                  |                                            | 4. Monitoring application activity              |
|                                  |                                            | 5. Question Breakdown                           |
|                                  | 12. Appropriate data security options      | 1. Secure data at-rest                          |
|                                  |                                            | 2. Secure data in-transit with SSL              |
|                                  |                                            | 3. Secure data in-transit with network features |
|                                  |                                            | 4. Key Management solutions                     |
|                                  |                                            | 5. Question Breakdown                           |
| 5. Cost-Optimised Architectures  | 13. Cost-effective storage                 | 1. Block and File storage costs                 |
|                                  |                                            | 2. Object Storage costs                         |
|                                  |                                            | 3. Question Breakdown                           |
|                                  | 14. Cost-effective compute & DB            | 1. EC2 Cost optimisation                        |
|                                  |                                            | 2.ECS and Lambda Cost optimisation              |
|                                  |                                            | 3. Database cost optimisation                   |
|                                  |                                            | 4. Question Breakdown                           |
|                                  | 15. Cost optimised network architectures   | 1. VPC cost optimisation                        |
|                                  |                                            | 2. Reguinal & Internet network transfer costs   |
|                                  |                                            | 3. Question Breakdown                           |
|                                  |                                            |                                                 |


## Questions

This is a good video course because at the end of each lesson, the instructor takes you through a couple of sample questions and explaining reasoning behind the correct/incorrect answers.

Questions that I have devised may be applicable. This technique came to me with the [Cornell Method](http://lsc.cornell.edu/notes.html?utm_source=hackernewsletter&utm_medium=email&utm_term=learn) of note-taking.

### L2: Resillient Architectures > Multi-Tier

#### [Chad's](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_02_02_04)

> An application is currently hosted on an EC2 Instance and consists of static images, Java code and a MySQL database. What steps could be performed to improve the resillience? (pick two.)

- **Move the database to RDS and enable Multi-AZ.**
- Resize the EC2 instance to increase memory and CPU.
- Move the static images and Javascript to an EFS volume.
- **Move the static images and JavaScript to an S3 bucket.**
- Move the static images/Javascript/Java to one EBS volume, and the database to a second volume.

> As an AWS network architect you are responsible for improving the resilience of an existing VPC network with the following configuration: Two AZ with public and private subnets, Internet Gateway and an EC2 NAT instance deployed in one public subnet for private subnet outbound internet traffic. Which of the following recommendations would most improve the resilience of the network architecture?

- Deploy public and private subnets into a third AZ.
- Upsize the EC2 NAT instance.
- Deploy a second EC2 NAT instance in the second AZ.
- **Replace the EC2 NAT instance with a NAT Gateway.**
    - _Replacing a SPOF_


### L3: Resillient Architectures > Design Highly Available and/or Fault-Tolerant Architectures

#### [Chad's](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_02_03_03)

> Assuming your application infrastructure has an availability requirement of 99.99%, which of the following resilience strategies would NOT achieve the required uptime?

- Deploying the database back end via RDS with Multi-AZ enabled.
- **Deploying infrastructure via CloudFormation templates. In a disaster, re-deploy from scratch.**
- Monitoring on all application layer KPIS with sensitive alarms and early notification, automated mitigation wherever possible.
- All web services are hosted behind ALB and use Auto Scaling, both in multiple availability zones.

>  As an AWS application architect, you've been asked to design a multi-tier application infrastructure that is highly available AND fault tolerant end-to-end. Which of the following solutions would meet these requirements?

- Elastic Load Balancer, Auto Scaling on EC2, RDS Multi-AZ.
- CloudFront, Elastic Load Balancer, Auto Scaling on EC2, RDS Multi-AZ. 
- CloudFront, S3, Elastic Load Balancer, ECS on EC2, RDS Aurora Serverless.
- **S3, API Gateway, Lambda, DynamoDB**.

### L4: Resillient Architectures > Design Decoupling Mechanisms

#### [Chad's](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_02_04_04)

> An application team supports a service that runs on a single EC2 instance with an EIP attached. The service accepts HTTP requests and performs asynchronous work before placing results in a S3 bucket. There is a new requirement to improve the overall resilience of the application. Which of the following decoupling solutions will best improve the resilience of the infrastructure?

- Create an AMI of the instance. Launch two instances from the AMI and place them behind an Application Load Balancer. 
- Create an AMI of the instance. Create an Auto Scaling group using the AMI in a Launch Template, and associate the ASG with an Application Load Balancer.
- **Create an SQS Queue. Place requests in the queue, and migrate the app code to a Lambda function that is triggered by messages in the queue.**
- Create an SQS Queue. Place requests in the queue and poll the queue from the EC2 instance


> An application architecture consists of an Auto Scaling Group of EC2 instances that communicates with an RDS database for storing relational data. During the daily peak, database writes overload the RDS instance and impact the customer experience. You've been asked to evaluate a solution that will protect the user experience during peak load. Which of the following architectural changes will best achieve this?

- **During peak load, submit database writes to an SQS Queue and process the queue asynchronously after the peak has passed.** 
- Upsize the RDS database instance to increase CPU and memory available during peak.
- Provision read replicas to separate RDS read requests from the primary write endpoint.
- Migrate the database to DynamoDB and provision the table as On-Demand.

### L5: Resillient Architectures > Appropriate storage

Chad covers availability (S3 Intelligent tiering is 3 9s 99.9%) and durability metrics for instance storage, EBS and EFS as well as if it's scoped at the Availability zone or Region (S3-Standard)

The durability is measured in 'Annual Failure Rate'. The AFR of EBS is 0.1% - 0.2%. EG. The durability of EBS snapshots and S3 is 11 9s.

#### [Chad's](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_02_05_04)

> Your team has been asked to implement an AWS storage infrastructure that can support multiple AZs within a region. Multiple EC2 instances will require access to the data. High availability is more important than performance. Which of the following solutions meet the requirements with the least operational overhead?

- AWS Storage Gateway in volume cache mode. Data stored in S3.
- Individual EBS volumes attached to instances. Data downloaded from S3. 
- GlusterFS installed on all instances with multiple partitions and replicas of data. 
- **EFS volume deployed in the region. Each EC2 instance mounts the volume via NFS.**

> An application is running on a singleton EC2 instance with no opportunity for horizontal scaling. The application data is stored and accessed from a single EBS volume. You've been asked to maximize the durability of this data with the ability to recover from accidental deletion of single files. Which of the following steps can be implemented to best meet the requirements? (Choose two.)

- Migrate the data to instance storage to improve IOPS performance.
- **Create a second EBS volume and write all files to both volumes**.
- **Using AWS Backup, schedule a daily snapshot of the data volume.**
- Create a single AMI of the instance.
- Migrate the data to an EBS striped raid filesystem.

### L6: Performant Architectures > Elastic & Scalable compute

Scalability: The ability to increase resources to accomodate increase demand (vertically/horizontally)

Elasticity: The ability to **increase** and **decrease**. Automation is implied.

#### [Chad's](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_03_06_03)

> An application is currently deployed using AWS Auto Scaling on EC2. The application experiences a steep traffic spike twice per week, but not always at the same time. The spike usually starts within the same 60 minute window. What strategy could be used to optimize for both cost and a good user experience, as the current Auto Scaling configuration is not able to scale fast enough at the start of the traffic spike?

- Configure Scheduled scale-out at the beginning of the hour window on the spike days.
- Increase the minimum instance number to more effectively handle the spikes.
- Write a shell script to execute manual scaling out before the hour window on spike days.
- **Configure Predictive Scaling on the Auto Scaling group.**

> An application is deployed into an Auto Scaling group for EC2, associated with a Target Group and an Application Load Balancer. The database is a DynamoDB table with on-demand scaling enabled. As traffic increases organically over time, which of the following will need to be reviewed periodically to ensure smooth scaling? (Choose two.)

- DynamoDB table maximum read/write ops
- **Auto Scaling Group maximum instances**
- DynamoDB table minimum read/write ops
- Auto Scaling Group minimum instances
- **Regional EC2 maximum vCPU quota**
    - _As traffic increases over time, the number of EC2 instances launched into the Auto Scaling group will increase. These will count against the regional EC2 vCPU quote along with the other EC2 instances. Watching this value and comparing against usage can ensure a smooth scaling experience_


### L7: Performant Architectures > High-performing, scalabale storage for workloads

- Max data rates (approx. at Mar 2020) but important to benchmark yourself
    - EBS standard HDD
        - 90 MiB/s
        - Low IOPS
    - SC1 - EBS Cold HDD
        - 250 MiB/s
        - IOPS dependent on size
    - ST1 - EBS Throughput optimised: 
        - 500 MiB/s
        - IOPS dependent on size
    - GP2 - EBS general purpose default:
        - 128 - 250 MiB/s
        - Up to 16,000 IOPS dependent on size
    - EBS Provisioned IOPS SSD
        - 1000 MiB/s
        - 64,000 IOPS
    - Striping multiple volumes together
        - 3500 Mbps
        - 160k IOPS

    
#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_03_07_06)

> When migrating an on-premises legacy database, an AWS architect must recommend an Oracle database hosting option that supports 32Tb of database storage and handles a sustained load higher than 60,000 IOPS. Which of the following choices should the architect recommend? (Choose two.)

- r5.12xlarge EC2 instance with multiple IOPS EBS volumes configured as a striped RAID. 
- **r4.16xlarge EC2 instance with multiple PIOPS EBS volumes configured as a striped RAID.**
    - Supports a total of 75,000 IOPS across all EBS volumes
- r4.16xlarge EC2 instance with a single GP2 EBS volume.
- **db.r5.24xlarge RDS instance with PIOPS storage.**
    - Supports up to 80,000 IOPS
    - RDS gives you option of setting storage as PIOPS
- db.r5.24xlarge RDS instance with GP2 storage.

> During the peak load every weekday, an MSSQL RDS database becomes overloaded due to heavy read traffic, impacting user request latencies. You've been asked to recommend a solution that improves the user experience and enables easier scaling during future anticipated increased load. Which of the following will best meet the requirements?

- **Configure an Elasticache cluster to cache database reads. Query the cache from the application before issuing reads to the database.**
- Increase either the RDS storage size or PIOPS to maximum value to improve database performance.
- Upsize the RDS database instance to improve database performance.
- Scale the application tier horizontally to accommodate more concurrent requests.


### L8: Performant Architectures > High-performing, network solutions for a workload

- Consolodate resources into single AZ to minimise latency and ensure they are in same colocated data centre with sub 1ms latency (smallest in AWS)
    - Weigh up with Resillience priorities

- Enable Jumbo frames @ 9000 MTU to ensure the efficiency of TCP traffic (esp large payloads) and we need to know if data is egressing at a gateway, will the packet fragment.


#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_03_08_04)

> An application is deployed with Apache Kafka onto a fleet of EC2 instances. There are multiple Kafka topics and multiple partitions per topic. The application requires high performance and low latency. Which of the following recommendations would achieve this? (Choose two.)

- Use an EC2 Spread Placement Group during instance launch.
    - _Designed more for resillience than performance_
- Use an EC2 Cluster Placement Group during instance launch.
    - _not good for resillience or outside communication_
- **Use an EC2 Partition Placement Group during instance launch.**
    - _Good for spreading instances accross hardware so instances in one partition don't share underlying hardware with instances in other partitiions and ideal for distributed workloads_
- Configure jumbo frames on the EC2 instances.
- **Use EC2 instance types that support Enhanced Networking.**

> You've been asked to design a network and application infrastructure for a three-tier app consisting of the following: load balancer, application servers and database. The application servers must communicate with S3 regularly. What would be your design recommendation, assuming that performance is the highest priority?

- Deploy separate ALB and EC2 Auto Scaling into each AZ. Deploy Multi-AZ RDS, with read replica in the second AZ. S3 communication through a VPC Gateway Endpoint.
- **Deploy separate ALB and EC2 Auto Scaling into each AZ. Deploy Aurora multi-master into same two AZ. S3 communication through a VPC Gateway Endpoint.**
- Deploy ALB, EC2 and RDS using multi-AZ configuration of each. S3 communication through the Internet Gateway.
- Deploy multi-AZ ALB. Deploy separate EC2 Auto Scaling into each AZ. Deploy multi-AZ RDS with read replica in the second AZ. S3 communication through the Internet Gateway.



### L9: Performant Architectures > High-performing databases


#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_03_09_03)

An HR application back end is running Postgres on an m5.xlarge EC2 instance with a single 100Gb IOPS EBS volume with 2000 provisioned IOPS. During company holidays and other slow times, the database experiences almost zero load. During mid-year and end-of-year reviews, the database gets overloaded during the days. What change would you propose to improve performance during the peaks while optimizing for cost during the slow times?

- Provision the maximum (based on 100Gb) of 5000 IOPS on the EBS volume.
- **Migrate the database to RDS Aurora Serverless and provision appropriate min/max ACUS (Aurora Compute Units) to match the peaks and slow times.**
    - _Will address peak and slow periods although min and max may need to be adjusted periodically_

- Migrate the database to RDS and provision read replicas to handle the peak load.
    - _This migration may address the peak times but there is no guarantee_
- Resize the instance to m5.4xlarge to increase resources available to Postgres.

> For a new application, a database architect has been asked to design a DynamoDB table that must store persistent session data. The table must be designed for high performance, and a TTL will be configured to expire items when they reach 30 days age. What partition key choice would lead to the highest performing table that will scale with the size of the table?

- **Username**
    - _A reasonable choice for a partition key as tends to have even distribution across a wide range of alphanumeric characters_
- Session Creation Date
- User Region
- Last Name

### L10: Secure Architectures > Design Secure access to AWS resources

- Account and user-based access control

- Service Control Policy (SCP) specify boundaries of what and cannot be done in AWS account(s).
    - Can only be used to deny

- At the user level, permissions are defined to ALLOW whereas permission boundaries can be set to define boundaries as the maximum set of permissions allowed regardless of what's been granted in permission policy documents.

- IAM roles are like `sudo` and most efficient way to grant access and allow temporary permissions.
    - Good for cross account access. E.g for consulting
    - Good for cross-service access

- Resource-based permissions
    - eg. S3 - only applies to single bucket
        - _be super aware of S3 Block public access override_
    - eg. Lambda function access policy
    - eg. API Gateway resource policy
        - Can force user to be authenticated before request is granted.
    - eg. SNS access policy (for AWS budgets say) to individual topics

#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_04_10_04)

> Which of the following would be an appropriate least-privilege policy addition for an SCP to be applied to all member accounts in an AWS Organization?

- Deny EC2 Termination actions to all users.
    - _a functionality breaker rather than least-privilege_
- Deny S3 Bucket delete actions to all users.
    - _a functionality breaker rather than least-privilege_
- Allow administrative permissions to all IT admin.
    - _any time a question asks about least-privilege, the answer will not be related to **ALLOW**ing permissions_
- **Deny Cloudtrail delete actions to all users.**

> In an AWS account, the following permissions have been configured:<br><br>
    1. IAM Policy granting full access to objects in a single S3 bucket<br>
    2. IAM Permission boundary granting administrative access to EC2<br>
    3. S3 Bucket policy that denies delete actions on the bucket<br><br>
Which of the following actions is possible with all of the above permissions in place for a single IAM User?

- Upload a new object to the S3 Bucket.
    - _Overridden by the IAM permission boundary which does not permit this action so will be denied_
- Launch an EC2 instance.
- Delete the S3 bucket.
- Resize an EC2 instance.
    - _Not included in an IAM policy. No condition/keyword for this_
- **None of these are possible**.

### L11: Secure Architectures > Design Secure Application Tiers

- NACL as block-list between subnets because acting as allow-list in both directions can mean for overly complex network configuration
    - eg. Block outbound from a Public subnet to a database subnet
    - eg. Block inbound  from database subnet to a public subnet 

- Security groups will block all by default and because security groups are stateful (attached to resources) - the rules only need to be created in one direction.
    - _'security groups whitelist application traffic'_

- Gateway endpoints can be used to provide private network access to either S3 or Dynamo DB

- Virtual Private Gateway can be used by a non-encrypted network into your VPC and VPN connections to outside networks as well as Direct Connect.

- Unauthorized requests containing a SQL injection attack (or missing authorisation headers) can be rejected by using a web application firewall.

- Tools for monitoring network & application activity
    - Cloudtrail > CloudwWatch Logs > apply alarm
        - _audit trail of actions taken in AWS account_
    - EC2 running CW Agent
    - AWS Config
        - _specify rules to monitor resource changes to get notified if resource are no longer complying with your security control_
    - GuardDuty
        - Start a workflow with this tool that monitors API key usage by generating an ML model on your account's normal behaviour
    - Amazon Macie
        - Monitors sensitive S3 objects
    - CloudWatch Event Bus
        - Transaction Log of important happenings on Account
        - Event Rules watch for happenings
            - Target through to SNS
            - Target through to Lambda if more complex logic

#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_04_11_05)

> Your team supports a Java-based application that uses a JDBC connection to an RDS database running MySQL. The connection string contains hard-coded credentials. You've been asked to improve the security of the database credentials, and must account for a new 30-day password rotation policy on RDS. Which of the following meet the requirements with the least ongoing overhead?

- Move the database credentials to a text file on each instance. Read the text file upon application start. Update the text file on each instance when password is rotated. 
- Move the database credentials to SSM Parameter Store. Read the Parameter upon
application start. Update the Parameter when password is rotated.
- **Move the database credentials to AWS Secrets Manager. Read the Secret upon application start. Configure the Secret to rotate automatically**. 
- Move the database credentials to 53. Download the object upon application start. Update the S3 object when password is rotated.

> As an AWS network architect, you've been asked to design a VPC that must host the following:<br><br>
    1. ALB front end<br>
    2. Docker containers managed by ECS<br>
    3. RDS Aurora database.<br> 
Which of the following VPC security strategies would ensure the greatest security control over each of the application tiers?

- All applications in the same public subnets. Isolate workloads via Security Groups. 
- **Each application in dedicated subnets (ALB - public, ECS - private, RDS - private). Isolate workloads via Security Groups and NACLS.**
- ALB and ECS containers in the same public subnets, RDS in dedicated private subnets. Isolate workloads via Security Groups and NACLS. 
- ALB in dedicated public subnets, ECS and RDS colocated in the same private subnets. Isolate workloads via Security Groups and NACLS.


### L12: Secure Architectures > Select secure storage

- Securing data at-rest
    - EBS: has only a 1-2% impact on latency
    - EFS: has only a 1-2% impact on latency
    - RDS: option on Aurora
    - RedShift: 20-40% effect on performance
    - S3: enforce SSE with bucket policy
- All use KMS
    - Shared-tenancy service for sharing master keys
    - region-scoped
- Can always fallback to client side encryption

- Securing data In-transit
    - SSL cert installed on Cloudfront
    - SSL cert install on API gateway w/o HTTP listener
    - SSL cert installed on ELB

- Fully securing data in-transit end-to-end
    - VPN Gateway
        - No guarantees on performance as traffic traverses the internet
    - VPC peering
        - Guaranteed private because it doesn't touch public internet
        - Uses Amazon's LAN links
    - Direct Connect
        - secure by running a fibre link from your datacentre to a partner's data centre.
    - Do It Yourself
        - VPC -> Non-AWS Cloud using OpenVPN if instances on either end run software but you introduce SPOF

- Key Management Solutions
    - KMS
        - Largest integrations
    - CloudHSM
        - Hardware backed
    - AWS Certificate manager
    - Secrets Manager
        - Secure credential storage



#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_04_12_05)

> A company is building a data lake containing healthcare data that must be properly secured. The data will be stored in S3 using SSE-KMS and accessed by users who will be separated into two groups:<br><br> 
1. those that can view PHI (protected health information), and<br>
2. those that cannot.<br>
Which of the following strategies will meet the requirements using least privilege techniques and low operational overhead? (Choose two.)

- **Tag all S3 buckets and objects to indicate the presence of PHI. Create IAM Policies and S3 bucket policies using conditions based on the tags.**
    - _Tagging alone isn't a security control but may be used as a building block towards least privilege_

- Create an S3 full-access IAM policy and associate with users requiring PHI access. Create a more restrictive IAM policy for the non-PHI users. 
    - _Any strategy tbat involves "full" access to any any service will struggle to meet a least privilege requirement_

- **Tag all IAM users based on PHI access. Test for those tags using IAM Policy and S3 bucket policy conditions for object access and KMS CMK usage.** 
    - _Along with tagging, provides a mechanism for testing users with access rights_

- Write an application to interface with S3 and implement access using custom code. Create IAM policies and S3 bucket policies to allow access only through the application
    - _Meets functional requirement but introduces operational overhead and SPOF_

> An application has a requirement for end-to-end, in-transit encryption for all web traffic. The architecture will require a load balancer, and the Elastic Load Balancer service is being considered. Which of the load balancer options would meet the application encryption requirement? (Choose two.)

- **Classic Load Balancer, SSL listener**
    - _The SSL listener does not terminate the connection (because operates on layer 4) and will preserve the encryption from the client to the backend resource_
- Classic Load Balancer, TCP listener 
    - _Does not terminate connection but not encrypted so does not meet requirement_
- Classic Load Balancer, HTTPS listener
    - _HTTPS listener operates at layer 7 (Application layer) and will terminate the connection before reencrypting so does not meet requirement_
- Application Load Balancer
    - _Can only create HTTPS listener and will terminate and reincrypt_
- **Network Load Balancer**
    - _Only implements layer 4 listeners so will be sufficient if SSL listener is used_

### L13: Cost-Optimised Architectures > Cost-effective storage

```
                  Cost Optimised          Resilience               Performance

EBS Standard  +   Charged for IOPS        Lower limit on size      Lower IOPS capacity
              |                           (1 TB)                   (Low x00 IOP/S)
              |
              |                                                    IOPS not dependent on size
              |
              |
+--------------------------------------------------------------------------------------------+
              |
 EBS SC1      |   Appropriate for         Easy to upsize as        Throughput
 Cold HDD     |   cold storage data       data increases           dependent on
              |   sets                    (16 TB)                  size
              |
+---------------------------------------------------------------------------------------------+
              |
 EBS ST1      |   Appropriate for         Easy to upsize           Throughput
 Throughput   |   high throughput         as data increases        dependent on
 Optimised    |   datasets                (16 TB)                  size
              |
              |
+----------------------------------------------------------------------------------------------+
              |
  EBS GP2     |   Appropriate for        Easy to upsize            Throughput
  General     |   medium to high         as data increases         dependent on
  Purpose     |   IOPS-bound                                       size
  SSD         |   workloads
              |
              |
 +---------------------------------------------------------------------------------------------+
              |
  EBS PIOPS   |  Charged for            Easy to upsize
              |  provisioned IOPS       as data and
              |                         throughput increases
              |
              |
 +----------------------------------------------------------------------------------------------+
              |
  EFS         |  Only charged           File system is             IOPS/Throughput
              |  for data used          elastic so no              dependent on
              |                         need to provision size     amount of data
              |  Appropriate for
              |  larger data sets
              |  and file sizes
              v

```

#### Object storage costs

```
                      Cost Optimise         Resilience               Performance

  S3         Object   Highest storage       Highest availability     Appropriate for
  Standard   Access   cost                  of S3 storage            static website
             Cost                           classes                  objects
              +
              |                             4 9s
              |
+--------------------------------------------------------------------------------------------+
              |
              |      Lower                                           Appropriate for backups
  S3-IA       |      storage                Lower availability       requiring low latency
              |      cost                                            access
              |
+---------------------------------------------------------------------------------------------+
              |
              |     Dynamic moving          Availability           Appropriate for
 S3           |     between storage         according to           objects with
 Intelligent  |     class so cost is        current                changing
 Tiering      |     ^ariable                storage class          access patterns
              |
              |
              |     Monitoring &
              |     Automation
              |     charges
              |
 +---------------------------------------------------------------------------------------------+
              |                             Lowest availability    Appropriate for
  S3 onezone  |    Same as S3-IA                                   backups with
  infrequent  |                                                    lower availability
  access      |                                                    needs
  Z-IA        |
              |
 +----------------------------------------------------------------------------------------------+
              |
  Regular     |                             4 9s of                Appropriate
  Glacier     |                             availability           for archival
              |                                                    with min-hours
              |                                                    latency needs
              |
              |
              v

```

#### [Chad's Question Breakdown](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_05_13_03)

> After an audit of your company's AWS bill, there is an initiative to reduce costs, and you've been asked to focus on S3 usage. There are tens of millions of large objects spread across many buckets. The usage patterns are varied by bucket and prefix, and are not always predictable. Which of the following cost optimization strategies would be the most appropriate?

- Provision CloudFront distributions using the S3 buckets as origins to reduce the cost of
accessing the objects by caching.
    - _Cloudfront won't impact actual S3 storage costs_

- Manually migrate all objects to S3 Infrequent Access to reduce storage costs. 
    - _May make a difference but if we don't know access costs, may baloon costs_

- Create lifecycle policies on the S3 buckets that migrate objects to cheaper storage classes as they age, regardless of usage patterns. 

- Migrate objects to the S3 Intelligent-Tiering storage class to automate the optimization of
storage costs based on access frequency
    - _Solution that will allow you to account for variability_

> An application has a storage requirement of several terabytes on a single volume. The application owner would like to optimize for cost, and performance is not a priority. The application owner cannot predict the number of IOPS that will be required, but is ok with the drive being throttled as long as cost is top priority. Which EBS volume type would best meet the requirements?

- Standard
- **SC1**
    - _will only charge you based on volume size_
- ST1
- GP2
- PIOPS


[^1]: [https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_00_00_00?autoplay=false](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_00_00_00?autoplay=false)





