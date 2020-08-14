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
    - _Good for spreading instances accross hardware so instances in one partitiion don't share underlying hardware with instances in other partitiions and ideal for distributed workloads_
- Configure jumbo frames on the EC2 instances.
- **Use EC2 instance types that support Enhanced Networking.**

> You've been asked to design a network and application infrastructure for a three-tier app consisting of the following: load balancer, application servers and database. The application servers must communicate with S3 regularly. What would be your design recommendation, assuming that performance is the highest priority?

- Deploy separate ALB and EC2 Auto Scaling into each AZ. Deploy Multi-AZ RDS, with read replica in the second AZ. S3 communication through a VPC Gateway Endpoint.
- **Deploy separate ALB and EC2 Auto Scaling into each AZ. Deploy Aurora multi-master into same two AZ. S3 communication through a VPC Gateway Endpoint.**
- Deploy ALB, EC2 and RDS using multi-AZ configuration of each. S3 communication through the Internet Gateway.
- Deploy multi-AZ ALB. Deploy separate EC2 Auto Scaling into each AZ. Deploy multi-AZ RDS with read replica in the second AZ. S3 communication through the Internet Gateway.





[^1]: [https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_00_00_00?autoplay=false](https://learning.oreilly.com/videos/aws-certified-solutions/9780136721246/9780136721246-ACS2_00_00_00?autoplay=false)





