---
templateKey: "blog-post"
title: "Bayes Theorem과 Mahout를 활용한 스팸 필터링"
description: "Naive Bayes Classification 소개, Bayes Theorem의 수학적 이론을 설명하고 Naive Bayes Classification에 의한 Mahout 샘플 실행하고 웹에 SpamFilter를 적용하는 방법 등을 정리함."
author: "미물"
authorURL: "https://mimul.com"
date: "2012-04-02T23:13:47.000Z"
lastModificationTime: "2012-04-02T23:13:47.000Z"
image: "/img/blog/naive_bayes.png"
commentId: "bayes-theorem-and-mahout-2012-04-02"
tags:
  - Bayes
  - Mahout
---

#### Naive Bayes Classification 소개

Bayes Theorem에 근거한 분류법이며, Bayes Theorem은 조건부 확률에서는 새로운 정보를 알았을 때 확률의 개선이 일어나게 된다. 어떤 실험결과에서 나온 정보를 이용하여 어떤 사건의 처음 확률을 개선시킬 수 있는데, 여기서 처음 확률은 사전확률 (prior probability) 이라 하고, 개선된 확률을 사후확률 (posterior probability) 이라고 하며, 이러한 확률의 개선을 이루는 것이 베이즈의 정리 (Bayes Theorem) 이다.

즉, 기존에 모아놨던 데이터에서 어떠한 인과 관계를 분석하여 결과를 예측할 때 확률 Bayes Theorem을 활용한다. 예를 들어 스팸 분류시 각각의 비아그라, 페니스, 대출 등의 단어가 나타난다고 무조건 스팸처리를 하지는 않는다. 각각의 스팸성 단어들이 더 나왔을 때, 그리고 스팸일 확률이 높아짐으로써 그 때 스팸으로 분류를 시킨다. 이런게 Bayes Theorem의 원리를 활용한 것이다.

#### Bayes Theorem 수학적 이론

**1) 가정**

- 총 74개중에 30개의 이메일은 스팸 메세지다.
- 74개중 51개의 이메일은 penis를 포함하고 있다.
- penis란 단어가 들어가있는 20개의 이메일을 스팸으로 분류했다.

그런데 최근에 수신한 메일에 penis가 포함되었을 경우 스팸일 확률은?
A:spam, B:penis라면 아래처럼 Bayesian 알고리즘에 의해서 P(A|B) = P(B|A)P(A)/P(B).

여기에서
- P(A|B) - 사건B가 발생한 상태에서 사건A가 발생할 조건부 확률.
- P(B|A) - 사건A가 발생한 상태에서 사건B가 발생할 조건부 확률.
- P(A) - 사건A가 발생할 확률, B에 대한 어떠한 정보도 없는 상태에서 A가 발생할 확률.
- P(B) - 사건B가 발생할 확률, A에 대한 어떠한 정보도 없는 상태에서 B가 발생할 확률.

![Bayes Theorem 1](/img/blog/conditional-prob.png)

그래서 결국 확률을 계산하면 P(B-penis)는 51/74, P(A-spam) - 스팸일 확률 : 30/74, 스팸이라는 발생한 상태에 penis가 들어갈 확률 : 20/30.

![Bayes Theorem 2](/img/blog/spam-simple-bayes.png)

즉, penis가 포함된 이메일의 스팸일 확률은 0.39.
즉, "penis" 라는 단어가 email에 있을때 그게 스팸일 확률과, 스팸이 아닐 확률을 판단하는데 중요한 알고리즘중에 하나가 Naive Bayesian Classification이다.

**2) Naive Bayes Classification 방식**

위의 예제에 이어서
- viagra가 포한됨 이메일이 25개.
- 그중 24 이메일은 스팸으로 분류됨.
- 그럼 "viagra"와 "penis"가 포함된 이메일의 스팸일 확률은? 아래는 공식.

![Bayes Theorem 3](/img/blog/spam-multiple-bayes.png)

풀어쓰면.. 메일에 viagra 포함 확률 : 25/74, 메일이 스팸이라는 가정하게 vigra가 포함될 확률 : 24/30.

![Bayes Theorem 3](/img/blog/spam-multiple-bayes-naive.png)

그래서 확률은 0.928.결국 단어 하나가지고 스팸이라고 판단하는 건 오류일 확률이 높고 조건 확률이 추가되어 연관 확률이 높아지(개선되어 지)는 형태로 판단해서 스팸으로 분류를 함.

#### Naive Bayes Classification에 의한 Mahout 샘플 실행

```bash
> ./examples/bin/classify-20newsgroups.sh xnaivebayes
#아래 순으로 실행됨
wget http://people.csail.mit.edu/jrennie/20Newsgroups/20news-bydate.tar.gz
tar xzf 20news-bydate.tar.gz
./bin/mahout org.apache.mahout.classifier.bayes.PrepareTwentyNewsgroups \
  -p ${WORK_DIR}/20news-bydate/20news-bydate-train \
  -o ${WORK_DIR}/20news-bydate/bayes-train-input \
  -a org.apache.mahout.vectorizer.DefaultAnalyzer \
  -c UTF-8

./bin/mahout org.apache.mahout.classifier.bayes.PrepareTwentyNewsgroups \
  -p ${WORK_DIR}/20news-bydate/20news-bydate-test \
  -o ${WORK_DIR}/20news-bydate/bayes-test-input \
  -a org.apache.mahout.vectorizer.DefaultAnalyzer \
  -c UTF-8

./bin/mahout trainclassifier \
  -i ${WORK_DIR}/20news-bydate/bayes-train-input \
  -o ${WORK_DIR}/20news-bydate/bayes-model \
  -type bayes \
  -ng 1 \
  -source hdfs

./bin/mahout testclassifier \
  -m ${WORK_DIR}/20news-bydate/bayes-model \
  -d ${WORK_DIR}/20news-bydate/bayes-test-input \
  -type bayes \
  -ng 1 \
  -source hdfs \
  -method mapreduce
```

**1) Mahout 구동 결과**

![Mahout Run Result](/img/blog/bayes_result.png)

**2) Hadoop 결과**

```bash
> hadoop fs -ls /samples/mahout-work-k2/20news-bydate/bayes-model
Found 5 items
k2 sp 0 /mahout-work-k2/20news-bydate/bayes-model/_SUCCESS
k2 sg 0 /mahout-work-k2/20news-bydate/bayes-model/_logs
k2 sg 0 /mahout-work-k2/20news-bydate/bayes-model/trainer-tfIdf
k2 sg 0 /mahout-work-k2/20news-bydate/bayes-model/trainer-thetaNormalizer
k2 sg 0 /mahout-work-k2/20news-bydate/bayes-model/trainer-weights
```

위 결과 파일은 bayers-model 데이터로 나중에 스팸 필터의 근거 데이터로 활용한다.

#### SpamFilter용 웹 테스트 서블릿 작성

**1) Antispam.java**
```java
public class Antispam extends HttpServlet
{
	private static final long serialVersionUID = -1;
	private SpamClassifier sc;

	public void init() {
		try {
			sc = new SpamClassifier();
			//modelBasePath
			sc.init(new File("/mahout-work-k2/bayes-model"));
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {

		Reader reader = req.getReader();
		Map results = null;

		try {

			long t0 = System.currentTimeMillis();
			results = sc.classify(reader);
			long t1 = System.currentTimeMillis();
			// 리턴되는 카테고리군
			resp.getWriter().print(
					String.format("{\"category\":\"%s\", \"time\": %d}",
							results.get("Bayes-1"), t1 - t0));

		} catch (InvalidDatastoreException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		}

	}
}
```

**2) SpamClassifier.java**
```java
public class SpamClassifier {
	private static final Charset DEFAULT_CHARSET =
	 Charset.forName("UTF-8");
  private static final String BAYES_MODEL = "Bayes";
  //private static final String CBAYES_MODEL = "CBayes";
	private Algorithm algorithm;
	private Datastore datastore;
	private Analyzer analyzer;
	private Map contextMap =
			new LinkedHashMap();

	public SpamClassifier() {
		analyzer = new DefaultAnalyzer();
	}

	public void init(File... basePath) throws FileNotFoundException,
			InvalidDatastoreException {
		ClassifierContext context = null;
		for (File file : basePath) {
			if (!file.isDirectory() || !file.canRead()) {
				throw new FileNotFoundException(basePath.toString());
			}
			int ngrams = 1;
			algorithm = new BayesAlgorithm();
			BayesParameters p = new BayesParameters();
			// model directory
			p.set("basePath", file.getAbsolutePath());
			// debug
			p.set("verbose", "true");
			p.set("classifierType", "bayes");
			// hdfs
			//p.set("dataSource", "hdfs");
			p.set("encoding", "UTF-8");
			p.setGramSize(ngrams);
			// hdfs
			datastore = new InMemoryBayesDatastore(p);
			// hbase 없어짐
			//datastore = new HBaseBayesDatastore(modelBasePath, p);
			context = new ClassifierContext(algorithm, datastore);
			context.initialize();
			contextMap.put(BAYES_MODEL + "-" + ngrams, context);
		}
	}

	public Map classify(Reader mail) throws IOException,
			InvalidDatastoreException {
		String document[] =
		 BayesFileFormatter.readerToDocument(analyzer, mail);
		Map results =
		 new LinkedHashMap();
		for (String model : contextMap.keySet()) {
			ClassifierContext context = contextMap.get(model);
			ClassifierResult result =
			 context.classifyDocument(document, "unknown");
			results.put(model, result.getLabel());
		}
		return results;
	}
}
```

**3) web.xml**
```
<display-name>mahout-spamfilter</display-name>

<servlet>
	<servlet-name>AntiSpam</servlet-name>
	<servlet-class>com.mimul.examples.Antispam</servlet-class>
</servlet>
<servlet-mapping>
	<servlet-name>AntiSpam</servlet-name>
	<url-pattern>/*</url-pattern>
</servlet-mapping>
```

#### 테스트 결과

**1) ham/spam 다운로드**

- [http://spamassassin.apache.org/publiccorpus/20030228_easy_ham_2.tar.bz2](http://spamassassin.apache.org/publiccorpus/20030228_easy_ham_2.tar.bz2)
- [http://spamassassin.apache.org/publiccorpus/20030228_spam_2.tar.bz2](http://spamassassin.apache.org/publiccorpus/20030228_spam_2.tar.bz2)

**2) 웹 서블릿 스팸 필터 테스트**
```bash
> cd /database/server/mahout/examples/bin/work/spam/spam_2
> curl http://mimul.com/antispam/ -H "Content-T-Type: text/xml" \
 --data-ascii 00309.e35e529fcea4957316806e7b653a76d8
{"category":"talk.religion.misc", "time": 1}
```

**3) 서블릿 구동되면서 model 데이터 로드 됨**
```
bayes.SequenceFileModelReader: Read 50000 feature weights
bayes.SequenceFileModelReader: Read 100000 feature weights
bayes.SequenceFileModelReader: 193370.88331085682
bayes: rec.sport.baseball -129829.34738934 531784.7805821 -0.2441252679982
bayes:sci.crypt -193023.42370049533 531784.7805631821 -0.3629728242618669
bayes:rec.sport.hockey -167853.61597388217 531784.7805631821 -0.3156480245964
bayes:talk.politics.guns -203524.01489748 531784.7631821 -0.38271658170052
bayes:soc.religion.christian -163900.925564 531784.780521 -0.30820913219
bayes:sci.electronics -142854.1677345925 531784.7805631821 -0.2686598614886
bayes:comp.os.ms-windows.misc -531784.7805631821 531784.7805631821 -1.0
bayes:misc.forsale -143454.70176448984 531784.7805631821 -0.2697608261984583
bayes:talk.religion.misc -139428.74148504 531784.7805631821 -0.2621565024562
bayes:alt.atheism -139569.06867597546 531784.7805631821 -0.2624540486626301
bayes:comp.windows.x -178029.10523376046 531784.7805631821 -0.33477669638973
bayes:talk.politics.mideast -193075.00789450994 531784.780521 -0.36306922317
bayes:comp.sys.ibm.pc.hardware -138410.0209962 531784.780521 -0.260274477736
bayes:comp.sys.mac.hardware -125200.9927677 531784.7805821 -0.2354354389358
bayes:sci.space -192437.0009266271 531784.7805631821 -0.3618700797018455
bayes:rec.motorcycles -143142.2085540624 531784.7805631821 -0.269172159455
bayes:rec.autos -141800.9754990954 531784.7805631821 -0.26665106013173656
bayes:comp.graphics -166882.18654471828 531784.7805631821 -0.31381527568114
bayes:talk.politics.misc -165196.8278523 531784.731821 -0.31064635303
bayes:sci.med -192698.5183245711 531784.7805631821 -0.36236185270382393
```

#### 참조 사이트

- [How To Build a Naive Bayes Classifier](https://alexn.org/blog/2012/02/09/howto-build-naive-bayes-classifier.html)
- [Ham, spam and elephants (or how to build a spam filter server with Mahout)](https://emmaespina.wordpress.com/2011/04/26/ham-spam-and-elephants-or-how-to-build-a-spam-filter-server-with-mahout/)
